-- Galaxy wereldwijd: meldingen in de taal van de ontvanger
alter table public.profiles add column if not exists lang text check (lang is null or lang ~ '^[a-z]{2}$');

create table if not exists public.push_i18n (lang text not null, nl text not null, tr text not null, primary key (lang, nl));
alter table public.push_i18n enable row level security;
insert into public.push_i18n (lang, nl, tr) values
('en', 'Vergeet niet in te checken!', 'Don''t forget to check in!'),
('fr', 'Vergeet niet in te checken!', 'N''oublie pas de faire ton check-in !'),
('de', 'Vergeet niet in te checken!', 'Vergiss nicht einzuchecken!'),
('es', 'Vergeet niet in te checken!', '¡No olvides hacer check-in!'),
('it', 'Vergeet niet in te checken!', 'Non dimenticare il check-in!'),
('pt', 'Vergeet niet in te checken!', 'Não te esqueças do check-in!'),
('tr', 'Vergeet niet in te checken!', 'Check-in yapmayı unutma!'),
('pl', 'Vergeet niet in te checken!', 'Nie zapomnij się zameldować!'),
('ro', 'Vergeet niet in te checken!', 'Nu uita să faci check-in!'),
('ru', 'Vergeet niet in te checken!', 'Не забудь отметиться!'),
('uk', 'Vergeet niet in te checken!', 'Не забудь відмітитися!'),
('ar', 'Vergeet niet in te checken!', 'لا تنسَ تسجيل الحضور!'),
('zh', 'Vergeet niet in te checken!', '别忘了签到！'),
('ja', 'Vergeet niet in te checken!', 'チェックインを忘れずに！'),
('en', 'Galaxy-avond', 'Galaxy night'),
('fr', 'Galaxy-avond', 'Soirée Galaxy'),
('de', 'Galaxy-avond', 'Galaxy-Abend'),
('es', 'Galaxy-avond', 'Noche Galaxy'),
('it', 'Galaxy-avond', 'Serata Galaxy'),
('pt', 'Galaxy-avond', 'Noite Galaxy'),
('tr', 'Galaxy-avond', 'Galaxy gecesi'),
('pl', 'Galaxy-avond', 'Wieczór Galaxy'),
('ro', 'Galaxy-avond', 'Seară Galaxy'),
('ru', 'Galaxy-avond', 'Вечер Galaxy'),
('uk', 'Galaxy-avond', 'Вечір Galaxy'),
('ar', 'Galaxy-avond', 'سهرة Galaxy'),
('zh', 'Galaxy-avond', 'Galaxy 之夜'),
('ja', 'Galaxy-avond', 'Galaxyナイト'),
('en', 'begint over', 'starts in'),
('fr', 'begint over', 'commence dans'),
('de', 'begint over', 'beginnt in'),
('es', 'begint over', 'empieza en'),
('it', 'begint over', 'inizia tra'),
('pt', 'begint over', 'começa em'),
('tr', 'begint over', 'başlıyor:'),
('pl', 'begint over', 'zaczyna się za'),
('ro', 'begint over', 'începe în'),
('ru', 'begint over', 'начнётся через'),
('uk', 'begint over', 'почнеться через'),
('ar', 'begint over', 'يبدأ بعد'),
('zh', 'begint over', '开始于'),
('ja', 'begint over', '開始まで'),
('en', 'Je hebt nog ongelezen berichten van een match', 'You have unread messages from a match'),
('fr', 'Je hebt nog ongelezen berichten van een match', 'Tu as des messages non lus d''un match'),
('de', 'Je hebt nog ongelezen berichten van een match', 'Du hast ungelesene Nachrichten von einem Match'),
('es', 'Je hebt nog ongelezen berichten van een match', 'Tienes mensajes sin leer de un match'),
('it', 'Je hebt nog ongelezen berichten van een match', 'Hai messaggi non letti da un match'),
('pt', 'Je hebt nog ongelezen berichten van een match', 'Tens mensagens por ler de um match'),
('tr', 'Je hebt nog ongelezen berichten van een match', 'Bir eşleşmeden okunmamış mesajların var'),
('pl', 'Je hebt nog ongelezen berichten van een match', 'Masz nieprzeczytane wiadomości od dopasowania'),
('ro', 'Je hebt nog ongelezen berichten van een match', 'Ai mesaje necitite de la un match'),
('ru', 'Je hebt nog ongelezen berichten van een match', 'У тебя непрочитанные сообщения от пары'),
('uk', 'Je hebt nog ongelezen berichten van een match', 'У тебе непрочитані повідомлення від пари'),
('ar', 'Je hebt nog ongelezen berichten van een match', 'لديك رسائل غير مقروءة من تطابق'),
('zh', 'Je hebt nog ongelezen berichten van een match', '你有来自配对的未读消息'),
('ja', 'Je hebt nog ongelezen berichten van een match', 'マッチからの未読メッセージがあります'),
('en', 'beantwoordde de vraag van de avond', 'answered tonight''s question'),
('fr', 'beantwoordde de vraag van de avond', 'a répondu à la question du soir'),
('de', 'beantwoordde de vraag van de avond', 'hat die Frage des Abends beantwortet'),
('es', 'beantwoordde de vraag van de avond', 'respondió la pregunta de la noche'),
('it', 'beantwoordde de vraag van de avond', 'ha risposto alla domanda della sera'),
('pt', 'beantwoordde de vraag van de avond', 'respondeu à pergunta da noite'),
('tr', 'beantwoordde de vraag van de avond', 'akşamın sorusunu yanıtladı'),
('pl', 'beantwoordde de vraag van de avond', 'odpowiedział(a) na pytanie wieczoru'),
('ro', 'beantwoordde de vraag van de avond', 'a răspuns la întrebarea serii'),
('ru', 'beantwoordde de vraag van de avond', 'ответил(а) на вопрос вечера'),
('uk', 'beantwoordde de vraag van de avond', 'відповів(ла) на питання вечора'),
('ar', 'beantwoordde de vraag van de avond', 'أجاب عن سؤال المساء'),
('zh', 'beantwoordde de vraag van de avond', '回答了今晚的问题'),
('ja', 'beantwoordde de vraag van de avond', '今夜の質問に答えました'),
('en', 'plaatste een nieuw verhaal', 'posted a new story'),
('fr', 'plaatste een nieuw verhaal', 'a publié une nouvelle story'),
('de', 'plaatste een nieuw verhaal', 'hat eine neue Story gepostet'),
('es', 'plaatste een nieuw verhaal', 'publicó una nueva historia'),
('it', 'plaatste een nieuw verhaal', 'ha pubblicato una nuova storia'),
('pt', 'plaatste een nieuw verhaal', 'publicou uma nova história'),
('tr', 'plaatste een nieuw verhaal', 'yeni bir hikâye paylaştı'),
('pl', 'plaatste een nieuw verhaal', 'dodał(a) nową relację'),
('ro', 'plaatste een nieuw verhaal', 'a postat o poveste nouă'),
('ru', 'plaatste een nieuw verhaal', 'опубликовал(а) новую историю'),
('uk', 'plaatste een nieuw verhaal', 'опублікував(ла) нову історію'),
('ar', 'plaatste een nieuw verhaal', 'نشر قصة جديدة'),
('zh', 'plaatste een nieuw verhaal', '发布了新动态'),
('ja', 'plaatste een nieuw verhaal', '新しいストーリーを投稿しました'),
('en', 'Vraag van de avond', 'Tonight''s question'),
('fr', 'Vraag van de avond', 'Question du soir'),
('de', 'Vraag van de avond', 'Frage des Abends'),
('es', 'Vraag van de avond', 'Pregunta de la noche'),
('it', 'Vraag van de avond', 'Domanda della sera'),
('pt', 'Vraag van de avond', 'Pergunta da noite'),
('tr', 'Vraag van de avond', 'Akşamın sorusu'),
('pl', 'Vraag van de avond', 'Pytanie wieczoru'),
('ro', 'Vraag van de avond', 'Întrebarea serii'),
('ru', 'Vraag van de avond', 'Вопрос вечера'),
('uk', 'Vraag van de avond', 'Питання вечора'),
('ar', 'Vraag van de avond', 'سؤال المساء'),
('zh', 'Vraag van de avond', '今晚的问题'),
('ja', 'Vraag van de avond', '今夜の質問'),
('en', 'Je selfie is goedgekeurd: je hebt nu het echtheidsvinkje!', 'Your selfie was approved: you now have the verified tick!'),
('fr', 'Je selfie is goedgekeurd: je hebt nu het echtheidsvinkje!', 'Ton selfie est validé : tu as maintenant le badge vérifié !'),
('de', 'Je selfie is goedgekeurd: je hebt nu het echtheidsvinkje!', 'Dein Selfie wurde bestätigt: Du hast jetzt das Echtheits-Häkchen!'),
('es', 'Je selfie is goedgekeurd: je hebt nu het echtheidsvinkje!', 'Tu selfie fue aprobado: ¡ya tienes la marca verificada!'),
('it', 'Je selfie is goedgekeurd: je hebt nu het echtheidsvinkje!', 'Il tuo selfie è stato approvato: ora hai la spunta verificata!'),
('pt', 'Je selfie is goedgekeurd: je hebt nu het echtheidsvinkje!', 'A tua selfie foi aprovada: já tens o visto de verificação!'),
('tr', 'Je selfie is goedgekeurd: je hebt nu het echtheidsvinkje!', 'Selfien onaylandı: artık doğrulanmış rozetin var!'),
('pl', 'Je selfie is goedgekeurd: je hebt nu het echtheidsvinkje!', 'Twoje selfie zostało zatwierdzone: masz teraz znaczek weryfikacji!'),
('ro', 'Je selfie is goedgekeurd: je hebt nu het echtheidsvinkje!', 'Selfie-ul tău a fost aprobat: acum ai bifa de verificare!'),
('ru', 'Je selfie is goedgekeurd: je hebt nu het echtheidsvinkje!', 'Твоё селфи одобрено: теперь у тебя галочка подлинности!'),
('uk', 'Je selfie is goedgekeurd: je hebt nu het echtheidsvinkje!', 'Твоє селфі схвалено: тепер у тебе позначка справжності!'),
('ar', 'Je selfie is goedgekeurd: je hebt nu het echtheidsvinkje!', 'تمت الموافقة على صورتك: لديك الآن علامة التحقق!'),
('zh', 'Je selfie is goedgekeurd: je hebt nu het echtheidsvinkje!', '你的自拍已通过：现在你有认证标志了！'),
('ja', 'Je selfie is goedgekeurd: je hebt nu het echtheidsvinkje!', 'セルフィーが承認されました：認証マークが付きました！'),
('en', 'Je selfie-check is niet gelukt. Probeer het opnieuw in je profiel.', 'Your selfie check didn''t work. Try again in your profile.'),
('fr', 'Je selfie-check is niet gelukt. Probeer het opnieuw in je profiel.', 'Ta vérification selfie n''a pas fonctionné. Réessaie dans ton profil.'),
('de', 'Je selfie-check is niet gelukt. Probeer het opnieuw in je profiel.', 'Dein Selfie-Check hat nicht geklappt. Versuch es erneut in deinem Profil.'),
('es', 'Je selfie-check is niet gelukt. Probeer het opnieuw in je profiel.', 'Tu verificación con selfie no funcionó. Inténtalo de nuevo en tu perfil.'),
('it', 'Je selfie-check is niet gelukt. Probeer het opnieuw in je profiel.', 'La verifica selfie non è riuscita. Riprova nel tuo profilo.'),
('pt', 'Je selfie-check is niet gelukt. Probeer het opnieuw in je profiel.', 'A verificação por selfie falhou. Tenta outra vez no teu perfil.'),
('tr', 'Je selfie-check is niet gelukt. Probeer het opnieuw in je profiel.', 'Selfie kontrolün başarısız oldu. Profilinde tekrar dene.'),
('pl', 'Je selfie-check is niet gelukt. Probeer het opnieuw in je profiel.', 'Weryfikacja selfie nie powiodła się. Spróbuj ponownie w profilu.'),
('ro', 'Je selfie-check is niet gelukt. Probeer het opnieuw in je profiel.', 'Verificarea selfie nu a reușit. Încearcă din nou în profil.'),
('ru', 'Je selfie-check is niet gelukt. Probeer het opnieuw in je profiel.', 'Проверка селфи не прошла. Попробуй снова в профиле.'),
('uk', 'Je selfie-check is niet gelukt. Probeer het opnieuw in je profiel.', 'Перевірка селфі не вдалася. Спробуй ще раз у профілі.'),
('ar', 'Je selfie-check is niet gelukt. Probeer het opnieuw in je profiel.', 'لم ينجح التحقق بالصورة. حاول مرة أخرى في ملفك.'),
('zh', 'Je selfie-check is niet gelukt. Probeer het opnieuw in je profiel.', '自拍认证未通过。请在个人资料中重试。'),
('ja', 'Je selfie-check is niet gelukt. Probeer het opnieuw in je profiel.', 'セルフィー確認に失敗しました。プロフィールからもう一度お試しください。'),
('en', 'dagen op rij! Je hebt een nieuwe badge.', 'days in a row! You earned a new badge.'),
('fr', 'dagen op rij! Je hebt een nieuwe badge.', 'jours d''affilée ! Tu as un nouveau badge.'),
('de', 'dagen op rij! Je hebt een nieuwe badge.', 'Tage in Folge! Du hast ein neues Abzeichen.'),
('es', 'dagen op rij! Je hebt een nieuwe badge.', 'días seguidos. ¡Tienes una nueva insignia!'),
('it', 'dagen op rij! Je hebt een nieuwe badge.', 'giorni di fila! Hai un nuovo badge.'),
('pt', 'dagen op rij! Je hebt een nieuwe badge.', 'dias seguidos! Ganhaste um novo badge.'),
('tr', 'dagen op rij! Je hebt een nieuwe badge.', 'gün üst üste! Yeni bir rozet kazandın.'),
('pl', 'dagen op rij! Je hebt een nieuwe badge.', 'dni z rzędu! Masz nową odznakę.'),
('ro', 'dagen op rij! Je hebt een nieuwe badge.', 'zile la rând! Ai o insignă nouă.'),
('ru', 'dagen op rij! Je hebt een nieuwe badge.', 'дней подряд! У тебя новый значок.'),
('uk', 'dagen op rij! Je hebt een nieuwe badge.', 'днів поспіль! У тебе новий значок.'),
('ar', 'dagen op rij! Je hebt een nieuwe badge.', 'أيام متتالية! حصلت على شارة جديدة.'),
('zh', 'dagen op rij! Je hebt een nieuwe badge.', '天连续！你获得了新徽章。'),
('ja', 'dagen op rij! Je hebt een nieuwe badge.', '日連続！新しいバッジを獲得しました。')
on conflict (lang, nl) do update set tr = excluded.tr;

-- je taal opslaan (vanuit de app)
create or replace function public.set_lang(l text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or l !~ '^[a-z]{2}$' then return; end if;
  update public.profiles set lang = l where id = auth.uid() and lang is distinct from l;
end $$;
revoke all on function public.set_lang(text) from public; grant execute on function public.set_lang(text) to authenticated;

create or replace function public.push_tx(l text, s text) returns text language plpgsql stable security definer set search_path = public, pg_temp as $$
declare r record; o text := s;
begin
  if s is null or l is null or l = 'nl' then return s; end if;
  for r in select nl, tr from public.push_i18n where lang = case when exists (select 1 from public.push_i18n where lang = l) then l else 'en' end order by length(nl) desc loop
    o := replace(o, r.nl, r.tr);
  end loop;
  return o;
end $$;

-- queue_push vertaalt titel en tekst naar de taal van de ontvanger (beheerdersmeldingen blijven Nederlands)
create or replace function public.queue_push(u uuid, k text, ttl text, bd text, link text, tg text, cool interval)
returns void language plpgsql security definer set search_path = public as $$
declare l text;
begin
  if u is null then return; end if;
  if exists (select 1 from profiles where id = u and banned_at is not null) then return; end if;
  if not exists (select 1 from push_subs where user_id = u) then return; end if;
  if exists (select 1 from push_queue where user_id = u and tag = tg and created_at > now() - cool) then return; end if;
  if k <> 'admin' then select lang into l from profiles where id = u; ttl := public.push_tx(l, ttl); bd := public.push_tx(l, bd); end if;
  insert into push_queue (user_id, kind, title, body, url, tag) values (u, k, left(ttl, 60), left(bd, 180), left(link, 120), left(tg, 80));
end $$;
revoke all on function public.push_tx(text, text) from public, anon, authenticated;

-- Galaxy-avond: herinnering zonder tijdzone (werkt overal ter wereld)
create or replace function public.auto_event_reminders() returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select g.user_id, e.id, e.venue, e.starts_at from events e join event_going g on g.event_id = e.id
            where e.starts_at between now() + interval '1 hour' and now() + interval '2 hours' loop
    perform public.queue_push(r.user_id, 'feed', 'Galaxy-avond', '🎉 ' || r.venue || ' – begint over ' || greatest(1, round(extract(epoch from r.starts_at - now()) / 60))::int || ' min. Vergeet niet in te checken!', './?ev=' || r.id, 'ev-' || r.id, interval '1 day');
  end loop;
end $$;
revoke all on function public.auto_event_reminders() from public, anon, authenticated;
