-- Loads Nicole's events, work and profile details into the FIRST account created.
-- Sign up in the app first, then run this once in the Supabase SQL editor.

do $$
declare
  host uuid := (select id from public.profiles order by created_at limit 1);
  m_music uuid; m_film uuid; m_live uuid; m_events uuid;
  e_kickback uuid; e_curtain uuid; e_jazz uuid; e_nexup uuid; e_nff2 uuid;
begin
  if host is null then
    raise exception 'Sign up in the app first so there is a profile to attach this to.';
  end if;

  update public.profiles set
    name = case when name = '' then 'Nicole Hernandez Colin' else name end,
    tagline = 'Artist · Creative entrepreneur · Golfer',
    location = 'San Diego',
    bio = 'Multidisciplinary artist pushing culture through intersectionality. I started Nexus because I see everything connecting. My debut album Layers and its short film Layered Visions are a fusion of Afro-Cuban R&B.',
    roles = array['Musician', 'Producer', 'Filmmaker'],
    open_to = array['Band members', 'Music video crews', 'Event partners', 'Sponsors'],
    skills = array['Vocals'],
    projects = array['Music video', 'Live show'],
    onboarded = true
  where id = host;

  insert into public.events (slug, host, title, badge, starts_on, when_text, where_text, about, sale_kind, tiers, featured) values
    ('kickback', host, 'Creative Kickback · Nexus turns one', 'Nexus event', '2026-10-25', 'Saturday, October 25', 'Granada House, San Diego',
     'A year of Nexus, celebrated with the people who built it. Bring a friend you want to make something with.',
     'tickets', '[{"id":"ga","name":"General admission","price":12}]', false)
    returning id into e_kickback;
  insert into public.events (slug, host, title, badge, starts_on, when_text, where_text, about, sale_kind, tiers, featured) values
    ('curtain', host, 'Behind The Curtain', 'UC Series', '2026-10-30', 'Friday, October 30, 2026', 'UC San Diego · venue announced soon',
     'An evening of live music, performance and projected light, wrapped in sheer curtains and haze. The launch night of the Nexus UC Series at UC San Diego.',
     'tickets', '[{"id":"student","name":"UCSD student","price":10,"note":"Student ID checked at the door"},{"id":"ga","name":"General admission","price":20}]', true)
    returning id into e_curtain;
  insert into public.events (slug, host, title, badge, starts_on, when_text, where_text, about, sale_kind, tiers) values
    ('latin-jazz', host, 'Latin Jazz Night', 'Nexus music', null, 'November · date announced soon', 'San Diego',
     'Every month, a new lineup and the same heat. A night San Diego can come back to.',
     'tickets', '[{"id":"ga","name":"General admission","price":15}]')
    returning id into e_jazz;
  insert into public.events (slug, host, title, badge, starts_on, when_text, where_text, about, sale_kind) values
    ('nex-up', host, 'Nex Up', 'Free showcase', null, 'Monthly', 'San Diego, a new room each month',
     'The next voices in San Diego, heard first. A handpicked lineup of emerging artists, always free.', 'free')
    returning id into e_nexup;
  insert into public.events (slug, host, title, badge, starts_on, when_text, where_text, about, sale_kind) values
    ('nff2', host, 'Nexus Film Festival · 2nd Edition', 'Nexus Film', '2027-04-01', 'April 2027', 'San Diego · venue revealed soon',
     'The 1st Edition sold out all 248 seats under the Giant Dome. The 2nd Edition brings a new lineup and a bigger program. Tickets go out by fair drawing.', 'drawing')
    returning id into e_nff2;

  insert into public.work_modules (owner, title, blurb, position) values (host, 'Music', 'Afro-Cuban R&B', 0) returning id into m_music;
  insert into public.work_modules (owner, title, blurb, position) values (host, 'Film', 'Short films', 1) returning id into m_film;
  insert into public.work_modules (owner, title, blurb, position) values (host, 'Live shows', 'Stages and sets', 2) returning id into m_live;
  insert into public.work_modules (owner, title, blurb, position) values (host, 'My events', 'Nexus nights, series and festivals', 3) returning id into m_events;

  insert into public.work_items (module_id, owner, title, detail, kind, about, position, event_id) values
    (m_music, host, 'Layers', 'Debut album', 'Album', 'Nicole''s debut album, a fusion of Afro-Cuban roots and R&B, with a companion short film, Layered Visions.', 0, null),
    (m_film, host, 'Layered Visions', 'Short film · companion to Layers', 'Short film', 'The short film that accompanies Layers.', 0, null),
    (m_film, host, 'Pa Ya', 'Short film', 'Short film', '', 1, null),
    (m_live, host, 'Layers Reimagined', 'Live show · Quartyard SD', 'Live show', 'The songs from Layers, rearranged for a full band at Quartyard in San Diego.', 0, null),
    (m_events, host, 'Nexus Film Festival', '1st Edition · Sold out', 'Film festival',
     'On October 10, 2026, the first Nexus Film Festival sold out the Giant Dome Theater at the Fleet Science Center: 248 seats, 11 short films, 4 awards.', 0, e_nff2),
    (m_events, host, 'Behind The Curtain', 'UC Series launch · Oct 30', 'Live event', 'The first chapter of the Nexus UC Series at UCSD.', 1, e_curtain),
    (m_events, host, 'Latin Jazz Night', 'Monthly series', 'Music series', 'A monthly home for Latin jazz in San Diego.', 2, e_jazz),
    (m_events, host, 'Nex Up', 'Free monthly showcase', 'Showcase', 'A curated, always-free showcase for emerging San Diego artists.', 3, e_nexup);

  insert into public.event_team (event_id, person, part) values
    (e_curtain, host, 'Creative direction'), (e_jazz, host, 'Creative direction'), (e_nexup, host, 'Curation'),
    (e_kickback, host, 'Host'), (e_nff2, host, 'Founder and host');
end $$;
