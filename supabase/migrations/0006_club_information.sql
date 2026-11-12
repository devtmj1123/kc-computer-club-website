-- Make the remaining public club copy editable from /admin/settings.
-- Public pages fall back to the same defaults in src/lib/club-settings.ts, so this
-- migration can be applied safely at any time.

alter table public.club_settings
  add column if not exists club_name_en text,
  add column if not exists founded_year integer not null default 1983,
  add column if not exists group_count integer not null default 5,
  add column if not exists hero_eyebrow text,
  add column if not exists hero_title text,
  add column if not exists hero_subtitle text,
  add column if not exists hero_highlights jsonb not null default '[]'::jsonb,
  add column if not exists about_heading text,
  add column if not exists about_activities jsonb not null default '[]'::jsonb,
  add column if not exists faqs jsonb not null default '[]'::jsonb,
  add column if not exists join_title text,
  add column if not exists join_description text;

comment on column public.club_settings.club_name_en is
  'English club name shown in the header, footer and metadata.';
comment on column public.club_settings.founded_year is
  'Used for EST. labels and the calculated number of years in the homepage stats.';
comment on column public.club_settings.group_count is
  'Number of activity groups shown on the homepage.';
comment on column public.club_settings.hero_highlights is
  'JSON array of short labels shown under the homepage hero copy.';
comment on column public.club_settings.about_activities is
  'JSON array of {title, description} objects shown in the About page.';
comment on column public.club_settings.faqs is
  'JSON array of {question, answer} objects. Answers may contain newlines.';

-- Seed the current website copy for the single settings row. Existing custom
-- values are preserved because only blank / empty values are replaced.
update public.club_settings
set
  club_name_en = coalesce(nullif(btrim(club_name_en), ''), 'KUEN CHENG COMPUTER CLUB'),
  hero_eyebrow = coalesce(nullif(btrim(hero_eyebrow), ''), 'EST. 1983 — 四十余年 · 坤成中学'),
  hero_title = coalesce(nullif(btrim(hero_title), ''), '让好奇心，成为作品。'),
  hero_subtitle = coalesce(
    nullif(btrim(hero_subtitle), ''),
    '电脑学会成立于 1983 年，至今已有四十余年历史。我们陪伴每一位团员从第一行代码走到第一个上线项目，在持续学习、动手实践与展示成果中，把好奇心变成真正的作品。'
  ),
  hero_highlights = case
    when hero_highlights = '[]'::jsonb then jsonb_build_array(
      '电脑室 · 例常活动',
      '项目制学习',
      '开放给全校'
    )
    else hero_highlights
  end,
  about_heading = coalesce(nullif(btrim(about_heading), ''), '一起学习，一起创造。'),
  about_activities = case
    when about_activities = '[]'::jsonb then jsonb_build_array(
      jsonb_build_object(
        'title', '例常课程',
        'description', '按分组级别进行电脑与资讯工艺课程，从基础操作到进阶主题。'
      ),
      jsonb_build_object(
        'title', '项目实践',
        'description', '以团队形式完成真实项目，把课堂上学到的知识变成可以运行的作品。'
      ),
      jsonb_build_object(
        'title', '校园技术支持',
        'description', '为学校活动提供控制室、LED 屏幕与现场技术协助，积累实战经验。'
      ),
      jsonb_build_object(
        'title', '比赛与工作坊',
        'description', '参与校内外比赛、工作坊与技术分享，和同伴一起持续进步。'
      )
    )
    else about_activities
  end,
  faqs = case
    when faqs = '[]'::jsonb then jsonb_build_array(
      jsonb_build_object(
        'question', '如何成为团员？',
        'answer', E'坤成初一新生：可以在新生营招生展来我们的摊位了解详情，之后在校务系统选取电脑学会即可。\n坤成其他年级学生：可以在年尾转换社团时来摊位了解详情，面试获得录取后填写转换社团表格，交给联课处。'
      ),
      jsonb_build_object(
        'question', '有分高级组和初级组吗？',
        'answer', E'有。高级组为 2 学点，初级组为 1 学点；初级组团员只需认真上课与交功课。\n高级组除了上课，也需要参与服务，例如在学校演奏会、周会与多元学习日的控制室协助控制 LED 屏幕。'
      ),
      jsonb_build_object(
        'question', '活动信息在哪里发布？',
        'answer', '请查看本网站的公告与活动页面，或关注我们的 Instagram，了解社团日常与最新动态。'
      ),
      jsonb_build_object(
        'question', '完全没有电脑经验的学生可以加入吗？',
        'answer', '当然可以。科技影响着每一个领域，无论你来自理科、文科还是商科，只要对电脑有兴趣，都欢迎加入我们。'
      )
    )
    else faqs
  end,
  join_title = coalesce(nullif(btrim(join_title), ''), '对电脑有兴趣，就足够了。'),
  join_description = coalesce(
    nullif(btrim(join_description), ''),
    '查看近期活动，或登录成员账号了解更多社团信息。'
  )
where id = 1;
