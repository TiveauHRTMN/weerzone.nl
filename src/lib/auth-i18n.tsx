/**
 * Audience + copy voor de auth-flow (/app/login, /app/signup, /app/reset, /auth-callback).
 *
 * De auth-pagina's leven onder /app/* zonder locale-prefix. We leiden de
 * "audience" af (in volgorde):
 *   1. ?lang= query-param (gezet door de locale-navigaties bij login-CTA's)
 *   2. pathname (b.v. /be/* of /lu/* sub-route)
 *   3. NL als fallback
 *
 * `AuthAudience` is breder dan `Locale`: het bevat ook `be` (België — NL-basis
 * met Belgische touches) en `lu` (Luxembourg — FR-basis met Luxemburgse touches).
 * Voor de copy gebruiken we de NL/FR-basis en overrulen alleen wat regionaal
 * verschilt (e-mail-voorbeeld, quote-auteur, home-link).
 *
 * Voeg hier nieuwe strings toe wanneer een auth-pagina nieuwe copy nodig heeft —
 * niet inline in de client-components.
 */

import type React from "react";
import type { Locale } from "@/config/locales";
import { LOCALES, detectLocale } from "@/config/locales";

export type AuthAudience = Locale | "be" | "lu";

const AUDIENCES: ReadonlyArray<AuthAudience> = ["nl", "de", "fr", "es", "be", "lu"];

export function resolveAuthAudience(
  langParam: string | null | undefined,
  pathname: string | null | undefined,
): AuthAudience {
  if (langParam && (AUDIENCES as readonly string[]).includes(langParam)) {
    return langParam as AuthAudience;
  }
  if (pathname) {
    if (pathname === "/be" || pathname.startsWith("/be/")) return "be";
    if (pathname === "/lu" || pathname.startsWith("/lu/")) return "lu";
  }
  return detectLocale(pathname ?? "/");
}

/** Welke onderliggende taal-bundel hoort bij een audience. */
export function audienceToLocale(audience: AuthAudience): Locale {
  if (audience === "be") return "nl";
  if (audience === "lu") return "fr";
  return audience;
}

/** Waar de "home"-knop in de auth-shell naar wijst. */
export function audienceHomeHref(audience: AuthAudience): string {
  if (audience === "be") return "/be";
  if (audience === "lu") return "/lu";
  return LOCALES[audience].routes.home;
}

/**
 * Plak `?lang=` (of `&lang=`) op een href, alleen wanneer relevant.
 *   appendLang("/app/signup", "fr")          → "/app/signup?lang=fr"
 *   appendLang("/app/signup?tier=piet", "be") → "/app/signup?tier=piet&lang=be"
 *   appendLang("/app/login", "nl")           → "/app/login"
 */
export function appendLang(href: string, audience: AuthAudience): string {
  if (audience === "nl") return href;
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}lang=${audience}`;
}


// ─── Translation dictionary ──────────────────────────────────────────────────

type AuthCopy = {
  // shared
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  fullName: string;
  fullNamePlaceholder: string;
  invalidEmail: string;
  invalidPassword: string;
  required: string;
  loading: string;
  back: string;

  // login
  loginWelcomeTitle: string;
  loginWelcomeSubtitle: string;
  loginSecureTitle: string;
  loginSecureSubtitle: string;
  loginEmailPrompt: string;
  loginContinue: string;
  loginChangeEmail: string;
  loginAccountFound: string;
  loginForgot: string;
  loginRememberMe: string;
  loginSubmit: string;
  loginMagicLinkCta: string;
  loginMagicLinkPending: string;
  loginCheckInbox: string;
  loginCheckInboxBody: (email: string) => string;
  loginCheckInboxHint: string;
  loginUsePasswordInstead: string;
  loginResendMagicLink: string;
  loginResendCooldown: (s: number) => string;
  loginOpenInboxLabel: string;
  loginNoAccount: string;
  loginCreateAccount: string;
  loginErrorCheckAccount: string;
  loginErrorWrongPassword: string;
  loginErrorMagicLinkFailed: string;
  loginErrorOAuth: string;

  // 2026 unified-screen flow
  loginUnifiedTitle: string;
  loginUnifiedSubtitle: string;
  loginContinueWithGoogle: string;
  loginContinueWithApple: string;
  loginOrDivider: string;
  loginEmailContinue: string;
  loginShowPassword: string;
  loginHidePassword: string;
  loginWaitingForLink: string;
  loginWaitingForLinkSub: string;
  loginAutoDetected: string;
  loginTypoSuggest: (suggested: string) => React.ReactNode;
  loginComingSoon: string;

  // signup
  signupTitle: string;
  signupSubtitle: string;
  signupHeading: string;
  signupSubheading: string;
  signupAgreeLabel: (terms: React.ReactNode, privacy: React.ReactNode) => React.ReactNode;
  signupTermsLink: string;
  signupPrivacyLink: string;
  signupSubmit: string;
  signupAlreadyHaveAccount: string;
  signupLogin: string;
  signupErrorAgree: string;
  signupErrorSignIn: string;
  signupQuoteText: string;
  signupQuoteAuthor: string;

  // reset
  resetSideTitle: string;
  resetSideSubtitle: string;
  resetHeading: string;
  resetBody: string;
  resetSubmit: string;
  resetBackToLogin: string;
  resetSentTitle: string;
  resetSentBody: (email: string) => React.ReactNode;
  resetNotReceived: string;
  resetTryAgain: string;

  // reset confirm
  resetConfirmSideTitle: string;
  resetConfirmSideSubtitle: string;
  resetConfirmExpiredTitle: string;
  resetConfirmExpiredBody: string;
  resetConfirmExpiredCta: string;
  resetConfirmDoneTitle: string;
  resetConfirmDoneBody: string;
  resetConfirmHeading: string;
  resetConfirmBody: string;
  resetConfirmNewPassword: string;
  resetConfirmRepeatPassword: string;
  resetConfirmRepeatPlaceholder: string;
  resetConfirmPasswordMismatch: string;
  resetConfirmSubmit: string;
};

const nl: AuthCopy = {
  email: "E-mailadres",
  emailPlaceholder: "je@voorbeeld.nl",
  password: "Wachtwoord",
  passwordPlaceholder: "Je wachtwoord",
  fullName: "Naam",
  fullNamePlaceholder: "Jouw naam",
  invalidEmail: "Vul een geldig e-mailadres in",
  invalidPassword: "Minimaal 8 tekens",
  required: "Vul dit veld in",
  loading: "Even geduld…",
  back: "Terug",

  loginWelcomeTitle: "Welkom terug.",
  loginWelcomeSubtitle: "Log in om je persoonlijke weerbericht en voorkeuren te beheren.",
  loginSecureTitle: "Beveiligde toegang.",
  loginSecureSubtitle: "Bevestig je identiteit om door te gaan naar je dashboard.",
  loginEmailPrompt: "Voer je e-mailadres in om verder te gaan.",
  loginContinue: "Doorgaan",
  loginChangeEmail: "E-mail wijzigen",
  loginAccountFound: "Account gevonden",
  loginForgot: "Vergeten?",
  loginRememberMe: "Onthoud mij op dit apparaat",
  loginSubmit: "Inloggen",
  loginMagicLinkCta: "Inloggen zonder wachtwoord",
  loginMagicLinkPending: "Inloglink versturen…",
  loginCheckInbox: "Check je inbox!",
  loginCheckInboxBody: (email) => `We hebben een inloglink gestuurd naar ${email}.`,
  loginCheckInboxHint:
    "Geen mail ontvangen? Check je spam, of stuur de link hieronder opnieuw.",
  loginUsePasswordInstead: "Toch met wachtwoord inloggen",
  loginResendMagicLink: "Stuur de inloglink opnieuw",
  loginResendCooldown: (s) => `Opnieuw versturen kan over ${s}s`,
  loginOpenInboxLabel: "Open inbox",
  loginNoAccount: "Nog geen account?",
  loginCreateAccount: "Maak er één",
  loginErrorCheckAccount: "Er ging iets mis bij het controleren van je account.",
  loginErrorWrongPassword:
    "Wachtwoord onjuist. Probeer het opnieuw, gebruik de inloglink of reset je wachtwoord.",
  loginErrorMagicLinkFailed: "Kon geen inloglink sturen. Probeer het later opnieuw.",
  loginErrorOAuth:
    "Inloggen via een sociale provider lukt nu niet. Probeer e-mail.",

  loginUnifiedTitle: "Welkom bij Weerzone.",
  loginUnifiedSubtitle:
    "Log in of maak een account. Geen wachtwoord nodig — we sturen je een inloglink.",
  loginContinueWithGoogle: "Doorgaan met Google",
  loginContinueWithApple: "Doorgaan met Apple",
  loginOrDivider: "of",
  loginEmailContinue: "Stuur me een inloglink",
  loginShowPassword: "Liever met wachtwoord",
  loginHidePassword: "Toch een inloglink gebruiken",
  loginWaitingForLink: "We wachten op je…",
  loginWaitingForLinkSub:
    "Klik op de link in je mail en deze tab logt zichzelf in.",
  loginAutoDetected: "Welkom terug — we herkenden je account",
  loginTypoSuggest: (suggested) => (
    <>
      Bedoelde je <strong>{suggested}</strong>?
    </>
  ),
  loginComingSoon: "Binnenkort",

  signupTitle: "Word onderdeel van Weerzone.",
  signupSubtitle:
    "Maak een gratis account en ontvang elke ochtend je persoonlijke weerbericht.",
  signupHeading: "Maak een account",
  signupSubheading: "Gratis proberen — geen creditcard nodig.",
  signupAgreeLabel: (terms, privacy) => (
    <>
      Ik ga akkoord met de {terms} en het {privacy}.
    </>
  ),
  signupTermsLink: "voorwaarden",
  signupPrivacyLink: "privacybeleid",
  signupSubmit: "Account aanmaken",
  signupAlreadyHaveAccount: "Heb je al een account?",
  signupLogin: "Inloggen",
  signupErrorAgree: "Je moet akkoord gaan met de voorwaarden",
  signupErrorSignIn: "Inloggen mislukt",
  signupQuoteText:
    "Sinds Weerzone weet ik precies wanneer ik mijn terras moet opruimen. Gewoon fijn.",
  signupQuoteAuthor: "Marieke, Utrecht",

  resetSideTitle: "Geen zorgen, dat lossen we zo op.",
  resetSideSubtitle:
    "Vul je e-mailadres in en we sturen je binnen een minuut een link om een nieuw wachtwoord in te stellen.",
  resetHeading: "Wachtwoord vergeten",
  resetBody:
    "Vul je e-mailadres in. We sturen je een link om je wachtwoord opnieuw in te stellen.",
  resetSubmit: "Stuur reset link",
  resetBackToLogin: "← Terug naar inloggen",
  resetSentTitle: "Check je inbox",
  resetSentBody: (email) => (
    <>
      We hebben een link gestuurd naar <strong>{email}</strong>. Klik erop om je
      wachtwoord opnieuw in te stellen.
    </>
  ),
  resetNotReceived: "Geen e-mail ontvangen?",
  resetTryAgain: "Opnieuw proberen",

  resetConfirmSideTitle: "Nog even een nieuw wachtwoord.",
  resetConfirmSideSubtitle:
    "Kies iets stevigs dat je goed onthoudt. Straks sta je er weer in.",
  resetConfirmExpiredTitle: "Link verlopen",
  resetConfirmExpiredBody:
    "Deze reset-link is niet meer geldig. Vraag hieronder een nieuwe aan.",
  resetConfirmExpiredCta: "Nieuwe link aanvragen",
  resetConfirmDoneTitle: "Wachtwoord ingesteld",
  resetConfirmDoneBody: "We sturen je even door naar je account…",
  resetConfirmHeading: "Nieuw wachtwoord",
  resetConfirmBody: "Minstens 8 tekens. Dubbel invullen voor de zekerheid.",
  resetConfirmNewPassword: "Nieuw wachtwoord",
  resetConfirmRepeatPassword: "Herhaal wachtwoord",
  resetConfirmRepeatPlaceholder: "Nog een keer",
  resetConfirmPasswordMismatch: "Wachtwoorden komen niet overeen",
  resetConfirmSubmit: "Wachtwoord opslaan",
};

const de: AuthCopy = {
  email: "E-Mail-Adresse",
  emailPlaceholder: "du@beispiel.de",
  password: "Passwort",
  passwordPlaceholder: "Dein Passwort",
  fullName: "Name",
  fullNamePlaceholder: "Dein Name",
  invalidEmail: "Gib eine gültige E-Mail-Adresse ein",
  invalidPassword: "Mindestens 8 Zeichen",
  required: "Bitte ausfüllen",
  loading: "Bitte warten…",
  back: "Zurück",

  loginWelcomeTitle: "Willkommen zurück.",
  loginWelcomeSubtitle:
    "Melde dich an, um deine persönlichen Wetterdaten und Einstellungen zu verwalten.",
  loginSecureTitle: "Sicherer Zugang.",
  loginSecureSubtitle:
    "Bestätige deine Identität, um zu deinem Dashboard zu gelangen.",
  loginEmailPrompt: "Gib deine E-Mail-Adresse ein, um weiterzumachen.",
  loginContinue: "Weiter",
  loginChangeEmail: "E-Mail ändern",
  loginAccountFound: "Konto gefunden",
  loginForgot: "Vergessen?",
  loginRememberMe: "Auf diesem Gerät merken",
  loginSubmit: "Anmelden",
  loginMagicLinkCta: "Ohne Passwort anmelden",
  loginMagicLinkPending: "Login-Link wird gesendet…",
  loginCheckInbox: "Posteingang prüfen!",
  loginCheckInboxBody: (email) => `Wir haben dir einen Login-Link gesendet an ${email}.`,
  loginCheckInboxHint:
    "Keine Mail erhalten? Prüfe deinen Spam-Ordner oder sende den Link unten erneut.",
  loginUsePasswordInstead: "Doch mit Passwort anmelden",
  loginResendMagicLink: "Login-Link erneut senden",
  loginResendCooldown: (s) => `Erneut senden in ${s}s`,
  loginOpenInboxLabel: "Posteingang öffnen",
  loginNoAccount: "Noch kein Konto?",
  loginCreateAccount: "Konto erstellen",
  loginErrorCheckAccount: "Beim Prüfen deines Kontos ist etwas schiefgelaufen.",
  loginErrorWrongPassword:
    "Das Passwort ist falsch. Versuche es erneut oder nutze den Login-Link.",
  loginErrorMagicLinkFailed: "Konnte keinen Login-Link senden. Versuche es später erneut.",
  loginErrorOAuth:
    "Anmeldung via soziale Anbieter ist derzeit nicht verfügbar. Nutze E-Mail.",

  loginUnifiedTitle: "Willkommen bei WEERZONE.",
  loginUnifiedSubtitle:
    "Melde dich an oder erstelle ein Konto. Kein Passwort nötig — wir senden dir einen Login-Link.",
  loginContinueWithGoogle: "Weiter mit Google",
  loginContinueWithApple: "Weiter mit Apple",
  loginOrDivider: "oder",
  loginEmailContinue: "Login-Link senden",
  loginShowPassword: "Lieber Passwort verwenden",
  loginHidePassword: "Doch Login-Link nutzen",
  loginWaitingForLink: "Wir warten auf dich…",
  loginWaitingForLinkSub:
    "Klick den Link in deiner Mail — dieser Tab meldet sich von selbst an.",
  loginAutoDetected: "Willkommen zurück — wir kennen dein Konto",
  loginTypoSuggest: (suggested) => (
    <>
      Meintest du <strong>{suggested}</strong>?
    </>
  ),
  loginComingSoon: "Demnächst",

  signupTitle: "Werde Teil von WEERZONE.",
  signupSubtitle:
    "Erstelle ein kostenloses Konto und erhalte jeden Morgen deinen persönlichen Wetterbericht — geschrieben von Karl.",
  signupHeading: "Konto erstellen",
  signupSubheading: "Kostenlos testen — keine Kreditkarte nötig.",
  signupAgreeLabel: (terms, privacy) => (
    <>
      Ich stimme den {terms} und der {privacy} zu.
    </>
  ),
  signupTermsLink: "Nutzungsbedingungen",
  signupPrivacyLink: "Datenschutzerklärung",
  signupSubmit: "Konto erstellen",
  signupAlreadyHaveAccount: "Hast du schon ein Konto?",
  signupLogin: "Anmelden",
  signupErrorAgree: "Du musst den Bedingungen zustimmen",
  signupErrorSignIn: "Anmelden fehlgeschlagen",
  signupQuoteText:
    "Seit WEERZONE weiß ich genau, wann ich meine Terrasse reinholen muss. Sehr praktisch.",
  signupQuoteAuthor: "Marieke, Utrecht",

  resetSideTitle: "Keine Sorge, das bekommen wir hin.",
  resetSideSubtitle:
    "Gib deine E-Mail-Adresse ein und wir schicken dir innerhalb einer Minute einen Link, um ein neues Passwort festzulegen.",
  resetHeading: "Passwort vergessen",
  resetBody:
    "Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link, um dein Passwort neu festzulegen.",
  resetSubmit: "Reset-Link senden",
  resetBackToLogin: "← Zurück zum Login",
  resetSentTitle: "Posteingang prüfen",
  resetSentBody: (email) => (
    <>
      Wir haben einen Link an <strong>{email}</strong> gesendet. Klicke darauf,
      um dein Passwort zurückzusetzen.
    </>
  ),
  resetNotReceived: "Keine E-Mail erhalten?",
  resetTryAgain: "Erneut versuchen",

  resetConfirmSideTitle: "Nur noch ein neues Passwort.",
  resetConfirmSideSubtitle:
    "Wähl etwas Stabiles, das du dir gut merken kannst. Gleich bist du wieder drin.",
  resetConfirmExpiredTitle: "Link abgelaufen",
  resetConfirmExpiredBody:
    "Dieser Reset-Link ist nicht mehr gültig. Fordere unten einen neuen an.",
  resetConfirmExpiredCta: "Neuen Link anfordern",
  resetConfirmDoneTitle: "Passwort gespeichert",
  resetConfirmDoneBody: "Wir bringen dich gleich zu deinem Konto…",
  resetConfirmHeading: "Neues Passwort",
  resetConfirmBody:
    "Mindestens 8 Zeichen. Bitte zur Sicherheit zweimal eingeben.",
  resetConfirmNewPassword: "Neues Passwort",
  resetConfirmRepeatPassword: "Passwort wiederholen",
  resetConfirmRepeatPlaceholder: "Noch einmal",
  resetConfirmPasswordMismatch: "Passwörter stimmen nicht überein",
  resetConfirmSubmit: "Passwort speichern",
};

const fr: AuthCopy = {
  email: "Adresse e-mail",
  emailPlaceholder: "vous@exemple.fr",
  password: "Mot de passe",
  passwordPlaceholder: "Votre mot de passe",
  fullName: "Nom",
  fullNamePlaceholder: "Votre nom",
  invalidEmail: "Saisissez une adresse e-mail valide",
  invalidPassword: "8 caractères minimum",
  required: "Ce champ est requis",
  loading: "Un instant…",
  back: "Retour",

  loginWelcomeTitle: "Bon retour.",
  loginWelcomeSubtitle:
    "Connectez-vous pour gérer votre météo personnalisée et vos préférences.",
  loginSecureTitle: "Accès sécurisé.",
  loginSecureSubtitle: "Confirmez votre identité pour accéder à votre tableau de bord.",
  loginEmailPrompt: "Entrez votre adresse e-mail pour continuer.",
  loginContinue: "Continuer",
  loginChangeEmail: "Changer d'e-mail",
  loginAccountFound: "Compte trouvé",
  loginForgot: "Oublié ?",
  loginRememberMe: "Se souvenir de moi sur cet appareil",
  loginSubmit: "Se connecter",
  loginMagicLinkCta: "Se connecter sans mot de passe",
  loginMagicLinkPending: "Envoi du lien…",
  loginCheckInbox: "Vérifiez votre boîte de réception !",
  loginCheckInboxBody: (email) => `Nous avons envoyé un lien de connexion à ${email}.`,
  loginCheckInboxHint:
    "Pas de mail ? Vérifiez vos spams, ou renvoyez le lien ci-dessous.",
  loginUsePasswordInstead: "Utiliser le mot de passe",
  loginResendMagicLink: "Renvoyer le lien de connexion",
  loginResendCooldown: (s) => `Nouveau lien disponible dans ${s}s`,
  loginOpenInboxLabel: "Ouvrir la boîte",
  loginNoAccount: "Pas encore de compte ?",
  loginCreateAccount: "Créez-en un",
  loginErrorCheckAccount: "Une erreur s'est produite lors de la vérification du compte.",
  loginErrorWrongPassword:
    "Mot de passe incorrect. Réessayez, utilisez le lien de connexion ou réinitialisez-le.",
  loginErrorMagicLinkFailed: "Impossible d'envoyer le lien. Réessayez plus tard.",
  loginErrorOAuth:
    "La connexion via un fournisseur tiers n'est pas disponible. Utilisez l'e-mail.",

  loginUnifiedTitle: "Bienvenue sur Weerzone.",
  loginUnifiedSubtitle:
    "Connectez-vous ou créez un compte. Pas de mot de passe nécessaire — nous vous enverrons un lien.",
  loginContinueWithGoogle: "Continuer avec Google",
  loginContinueWithApple: "Continuer avec Apple",
  loginOrDivider: "ou",
  loginEmailContinue: "Envoyer le lien de connexion",
  loginShowPassword: "Utiliser un mot de passe",
  loginHidePassword: "Utiliser plutôt le lien",
  loginWaitingForLink: "On vous attend…",
  loginWaitingForLinkSub:
    "Cliquez sur le lien dans votre mail — cet onglet se connectera tout seul.",
  loginAutoDetected: "Bon retour — votre compte est reconnu",
  loginTypoSuggest: (suggested) => (
    <>
      Vouliez-vous dire <strong>{suggested}</strong> ?
    </>
  ),
  loginComingSoon: "Bientôt",

  signupTitle: "Rejoignez Weerzone.",
  signupSubtitle:
    "Créez un compte gratuit et recevez chaque matin votre météo personnalisée — signée Luc.",
  signupHeading: "Créer un compte",
  signupSubheading: "Essai gratuit — sans carte bancaire.",
  signupAgreeLabel: (terms, privacy) => (
    <>
      J'accepte les {terms} et la {privacy}.
    </>
  ),
  signupTermsLink: "conditions d'utilisation",
  signupPrivacyLink: "politique de confidentialité",
  signupSubmit: "Créer le compte",
  signupAlreadyHaveAccount: "Vous avez déjà un compte ?",
  signupLogin: "Se connecter",
  signupErrorAgree: "Vous devez accepter les conditions",
  signupErrorSignIn: "Connexion échouée",
  signupQuoteText:
    "Depuis Weerzone, je sais exactement quand rentrer le linge. Vraiment pratique.",
  signupQuoteAuthor: "Camille, Lyon",

  resetSideTitle: "Pas d'inquiétude, on s'en occupe.",
  resetSideSubtitle:
    "Entrez votre e-mail et nous vous enverrons un lien dans la minute pour définir un nouveau mot de passe.",
  resetHeading: "Mot de passe oublié",
  resetBody:
    "Entrez votre adresse e-mail. Nous vous enverrons un lien pour réinitialiser votre mot de passe.",
  resetSubmit: "Envoyer le lien",
  resetBackToLogin: "← Retour à la connexion",
  resetSentTitle: "Vérifiez votre boîte de réception",
  resetSentBody: (email) => (
    <>
      Nous avons envoyé un lien à <strong>{email}</strong>. Cliquez dessus pour
      réinitialiser votre mot de passe.
    </>
  ),
  resetNotReceived: "Pas d'e-mail reçu ?",
  resetTryAgain: "Réessayer",

  resetConfirmSideTitle: "Un nouveau mot de passe.",
  resetConfirmSideSubtitle:
    "Choisissez quelque chose de solide et facile à retenir. Vous y êtes presque.",
  resetConfirmExpiredTitle: "Lien expiré",
  resetConfirmExpiredBody:
    "Ce lien de réinitialisation n'est plus valide. Demandez-en un nouveau ci-dessous.",
  resetConfirmExpiredCta: "Demander un nouveau lien",
  resetConfirmDoneTitle: "Mot de passe enregistré",
  resetConfirmDoneBody: "Nous vous redirigeons vers votre compte…",
  resetConfirmHeading: "Nouveau mot de passe",
  resetConfirmBody: "Au moins 8 caractères. Saisissez deux fois pour vérifier.",
  resetConfirmNewPassword: "Nouveau mot de passe",
  resetConfirmRepeatPassword: "Confirmez le mot de passe",
  resetConfirmRepeatPlaceholder: "Encore une fois",
  resetConfirmPasswordMismatch: "Les mots de passe ne correspondent pas",
  resetConfirmSubmit: "Enregistrer le mot de passe",
};

const es: AuthCopy = {
  email: "Correo electrónico",
  emailPlaceholder: "tu@ejemplo.es",
  password: "Contraseña",
  passwordPlaceholder: "Tu contraseña",
  fullName: "Nombre",
  fullNamePlaceholder: "Tu nombre",
  invalidEmail: "Introduce un correo válido",
  invalidPassword: "Mínimo 8 caracteres",
  required: "Este campo es obligatorio",
  loading: "Un momento…",
  back: "Volver",

  loginWelcomeTitle: "Bienvenido de nuevo.",
  loginWelcomeSubtitle:
    "Inicia sesión para gestionar tu pronóstico personal y tus preferencias.",
  loginSecureTitle: "Acceso seguro.",
  loginSecureSubtitle: "Confirma tu identidad para acceder a tu panel.",
  loginEmailPrompt: "Introduce tu correo para continuar.",
  loginContinue: "Continuar",
  loginChangeEmail: "Cambiar correo",
  loginAccountFound: "Cuenta encontrada",
  loginForgot: "¿Olvidaste?",
  loginRememberMe: "Recuérdame en este dispositivo",
  loginSubmit: "Iniciar sesión",
  loginMagicLinkCta: "Entrar sin contraseña",
  loginMagicLinkPending: "Enviando enlace…",
  loginCheckInbox: "¡Revisa tu bandeja!",
  loginCheckInboxBody: (email) => `Hemos enviado un enlace de acceso a ${email}.`,
  loginCheckInboxHint:
    "¿No ha llegado? Mira en spam o vuelve a enviarlo abajo.",
  loginUsePasswordInstead: "Usar contraseña",
  loginResendMagicLink: "Reenviar enlace",
  loginResendCooldown: (s) => `Podrás reenviar en ${s}s`,
  loginOpenInboxLabel: "Abrir bandeja",
  loginNoAccount: "¿Aún no tienes cuenta?",
  loginCreateAccount: "Créala",
  loginErrorCheckAccount: "Algo falló al comprobar tu cuenta.",
  loginErrorWrongPassword:
    "Contraseña incorrecta. Inténtalo de nuevo, usa el enlace o restablécela.",
  loginErrorMagicLinkFailed: "No se pudo enviar el enlace. Inténtalo más tarde.",
  loginErrorOAuth:
    "El acceso por proveedor externo no está disponible. Usa el correo.",

  loginUnifiedTitle: "Bienvenido a Weerzone.",
  loginUnifiedSubtitle:
    "Inicia sesión o crea una cuenta. Sin contraseña — te enviamos un enlace de acceso.",
  loginContinueWithGoogle: "Continuar con Google",
  loginContinueWithApple: "Continuar con Apple",
  loginOrDivider: "o",
  loginEmailContinue: "Enviarme el enlace de acceso",
  loginShowPassword: "Usar contraseña",
  loginHidePassword: "Mejor con enlace",
  loginWaitingForLink: "Te estamos esperando…",
  loginWaitingForLinkSub:
    "Haz clic en el enlace de tu correo — esta pestaña iniciará sesión sola.",
  loginAutoDetected: "Bienvenido de nuevo — reconocemos tu cuenta",
  loginTypoSuggest: (suggested) => (
    <>
      ¿Querías decir <strong>{suggested}</strong>?
    </>
  ),
  loginComingSoon: "Próximamente",

  signupTitle: "Únete a Weerzone.",
  signupSubtitle:
    "Crea una cuenta gratis y recibe cada mañana tu pronóstico personal — firmado por Juan.",
  signupHeading: "Crear cuenta",
  signupSubheading: "Prueba gratis — sin tarjeta.",
  signupAgreeLabel: (terms, privacy) => (
    <>
      Acepto las {terms} y la {privacy}.
    </>
  ),
  signupTermsLink: "condiciones",
  signupPrivacyLink: "política de privacidad",
  signupSubmit: "Crear cuenta",
  signupAlreadyHaveAccount: "¿Ya tienes cuenta?",
  signupLogin: "Iniciar sesión",
  signupErrorAgree: "Debes aceptar las condiciones",
  signupErrorSignIn: "No se pudo iniciar sesión",
  signupQuoteText:
    "Desde Weerzone sé exactamente cuándo regar las plantas. Muy práctico.",
  signupQuoteAuthor: "Lucía, Madrid",

  resetSideTitle: "Tranquilo, lo arreglamos.",
  resetSideSubtitle:
    "Introduce tu correo y te enviaremos un enlace en menos de un minuto para crear una nueva contraseña.",
  resetHeading: "Contraseña olvidada",
  resetBody:
    "Introduce tu correo. Te enviaremos un enlace para crear una nueva contraseña.",
  resetSubmit: "Enviar enlace",
  resetBackToLogin: "← Volver al inicio de sesión",
  resetSentTitle: "Revisa tu bandeja",
  resetSentBody: (email) => (
    <>
      Hemos enviado un enlace a <strong>{email}</strong>. Haz clic para
      restablecer tu contraseña.
    </>
  ),
  resetNotReceived: "¿No has recibido el correo?",
  resetTryAgain: "Intentar de nuevo",

  resetConfirmSideTitle: "Solo una contraseña nueva.",
  resetConfirmSideSubtitle:
    "Elige algo sólido que recuerdes bien. Ya casi estás dentro.",
  resetConfirmExpiredTitle: "Enlace caducado",
  resetConfirmExpiredBody:
    "Este enlace ya no es válido. Solicita uno nuevo abajo.",
  resetConfirmExpiredCta: "Solicitar nuevo enlace",
  resetConfirmDoneTitle: "Contraseña guardada",
  resetConfirmDoneBody: "Te llevamos a tu cuenta…",
  resetConfirmHeading: "Nueva contraseña",
  resetConfirmBody: "Mínimo 8 caracteres. Introdúcela dos veces para confirmar.",
  resetConfirmNewPassword: "Nueva contraseña",
  resetConfirmRepeatPassword: "Repite la contraseña",
  resetConfirmRepeatPlaceholder: "Otra vez",
  resetConfirmPasswordMismatch: "Las contraseñas no coinciden",
  resetConfirmSubmit: "Guardar contraseña",
};

const DICT: Record<Locale, AuthCopy> = { nl, de, fr, es };

// Regionale overrides: alleen velden die echt anders zijn. De rest komt uit de
// onderliggende NL of FR-basis. Houd dit klein — auth-pagina's hebben weinig
// regionale tekst.
const beOverrides: Partial<AuthCopy> = {
  emailPlaceholder: "je@voorbeeld.be",
  signupQuoteText:
    "Sinds Weerzone weet ik 's ochtends precies of mijn fietstocht doorgaat. Heel handig.",
  signupQuoteAuthor: "Sander, Antwerpen",
};

const luOverrides: Partial<AuthCopy> = {
  emailPlaceholder: "vous@exemple.lu",
  signupQuoteText:
    "Depuis Weerzone, je sais le matin si la balade en forêt tient. Très pratique.",
  signupQuoteAuthor: "Pierre, Luxembourg",
};

export function audienceCopy(audience: AuthAudience): AuthCopy {
  const base = DICT[audienceToLocale(audience)] ?? nl;
  if (audience === "be") return { ...base, ...beOverrides };
  if (audience === "lu") return { ...base, ...luOverrides };
  return base;
}

// ─── Welke persona-tier nemen we voor de magic-link mail-branding ────────────
// `sendBrandedMagicLink` accepteert alleen bestaande PersonaTier-keys
// ("piet" | "karl" | "reed" | "steve"). DE krijgt karl-branding, alle andere
// (NL/FR/ES/BE/LU) krijgen Piet-branding (mail-template is Nederlands; aparte
// taal-templates komen later met de Luc/Juan-tiers).
export function magicLinkBrandingTier(audience: AuthAudience): "piet" | "karl" {
  return audience === "de" ? "karl" : "piet";
}

// ─── Webmail deep-links (op basis van het e-maildomein) ──────────────────────
//
// Wanneer iemand een inloglink heeft aangevraagd is "open je inbox" een grotere
// hulp dan zo'n algemene melding. We mappen bekende domeinen naar de webmail-UI
// (ingelogde sessies openen meteen op de inbox). Onbekende domeinen krijgen
// geen knop — dat is minder verwarrend dan een verkeerde gok.

export interface InboxProvider {
  label: string;
  url: string;
}

const INBOX_PROVIDERS: Record<string, InboxProvider> = {
  // Google / Gmail
  "gmail.com":       { label: "Gmail",         url: "https://mail.google.com" },
  "googlemail.com":  { label: "Gmail",         url: "https://mail.google.com" },
  // Microsoft
  "outlook.com":     { label: "Outlook",       url: "https://outlook.live.com/mail" },
  "hotmail.com":     { label: "Outlook",       url: "https://outlook.live.com/mail" },
  "live.com":        { label: "Outlook",       url: "https://outlook.live.com/mail" },
  "msn.com":         { label: "Outlook",       url: "https://outlook.live.com/mail" },
  "hotmail.nl":      { label: "Outlook",       url: "https://outlook.live.com/mail" },
  "live.nl":         { label: "Outlook",       url: "https://outlook.live.com/mail" },
  "outlook.de":      { label: "Outlook",       url: "https://outlook.live.com/mail" },
  "hotmail.de":      { label: "Outlook",       url: "https://outlook.live.com/mail" },
  "outlook.fr":      { label: "Outlook",       url: "https://outlook.live.com/mail" },
  "hotmail.fr":      { label: "Outlook",       url: "https://outlook.live.com/mail" },
  "outlook.es":      { label: "Outlook",       url: "https://outlook.live.com/mail" },
  "hotmail.es":      { label: "Outlook",       url: "https://outlook.live.com/mail" },
  // Apple
  "icloud.com":      { label: "iCloud Mail",   url: "https://www.icloud.com/mail" },
  "me.com":          { label: "iCloud Mail",   url: "https://www.icloud.com/mail" },
  "mac.com":         { label: "iCloud Mail",   url: "https://www.icloud.com/mail" },
  // Yahoo
  "yahoo.com":       { label: "Yahoo Mail",    url: "https://mail.yahoo.com" },
  "yahoo.fr":        { label: "Yahoo Mail",    url: "https://mail.yahoo.com" },
  "yahoo.es":        { label: "Yahoo Mail",    url: "https://mail.yahoo.com" },
  "ymail.com":       { label: "Yahoo Mail",    url: "https://mail.yahoo.com" },
  // Proton
  "proton.me":       { label: "Proton Mail",   url: "https://mail.proton.me" },
  "protonmail.com":  { label: "Proton Mail",   url: "https://mail.proton.me" },
  "pm.me":           { label: "Proton Mail",   url: "https://mail.proton.me" },
  // NL providers
  "ziggo.nl":        { label: "Ziggo Webmail", url: "https://webmail.ziggo.nl" },
  "kpnmail.nl":      { label: "KPN Mail",      url: "https://webmail.kpnmail.nl" },
  "planet.nl":       { label: "Planet Mail",   url: "https://webmail.planet.nl" },
  "xs4all.nl":       { label: "XS4ALL Mail",   url: "https://webmail.xs4all.nl" },
  // FR provider
  "free.fr":         { label: "Free Webmail",  url: "https://webmail.free.fr" },
  "orange.fr":       { label: "Orange Mail",   url: "https://mail.orange.fr" },
  "laposte.net":     { label: "Laposte",       url: "https://www.laposte.net/accueil" },
  "sfr.fr":          { label: "SFR Mail",      url: "https://messagerie.sfr.fr" },
  // ES provider
  "telefonica.net":  { label: "Movistar",      url: "https://correoweb.movistar.es" },
};

export function inboxProviderFor(email: string): InboxProvider | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return INBOX_PROVIDERS[domain] ?? null;
}

// ─── Email typo-correctie ────────────────────────────────────────────────────
// Vangt veelvoorkomende verschrijvingen in het domein af (gmial.com →
// gmail.com). Werkt via een vaste lijst plus Damerau-Levenshtein afstand.
// We tonen alleen suggesties bij distance 1 of 2 — distance 3+ raadt te wild
// en frustreert. Werkt alleen op het domein-deel; local part laten we met
// rust (te veel valide varianten).

const POPULAR_DOMAINS: ReadonlyArray<string> = [
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "hotmail.nl",
  "hotmail.de",
  "hotmail.fr",
  "hotmail.es",
  "outlook.nl",
  "outlook.de",
  "outlook.fr",
  "outlook.es",
  "live.com",
  "live.nl",
  "icloud.com",
  "me.com",
  "yahoo.com",
  "yahoo.fr",
  "yahoo.es",
  "proton.me",
  "protonmail.com",
  "ziggo.nl",
  "kpnmail.nl",
  "xs4all.nl",
  "planet.nl",
  "casema.nl",
  "telfort.nl",
  "online.nl",
  "home.nl",
  "telenet.be",
  "skynet.be",
  "scarlet.be",
  "free.fr",
  "orange.fr",
  "laposte.net",
  "sfr.fr",
  "wanadoo.fr",
  "telefonica.net",
  "movistar.es",
  "terra.es",
  "gmx.de",
  "web.de",
  "t-online.de",
  "freenet.de",
];

function damerauLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}

/**
 * Stelt een correctie voor wanneer het domein duidelijk een typfout is van
 * een populair domein. Geeft `null` wanneer er geen overtuigende correctie is.
 *
 *   suggestEmailCorrection("foo@gmial.com") → "foo@gmail.com"
 *   suggestEmailCorrection("foo@gmail.com") → null  (al goed)
 *   suggestEmailCorrection("foo@bar.com")   → null  (te ver of onbekend)
 */
export function suggestEmailCorrection(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (POPULAR_DOMAINS.includes(domain)) return null;
  // Min 4 char domains om wilde matches te voorkomen
  if (domain.length < 4) return null;

  let best: { domain: string; dist: number } | null = null;
  for (const candidate of POPULAR_DOMAINS) {
    const dist = damerauLevenshtein(domain, candidate);
    if (dist === 0) return null;
    if (!best || dist < best.dist) {
      best = { domain: candidate, dist };
    }
  }
  if (!best) return null;
  // Distance threshold gekoppeld aan domeinlengte: 1 voor korte, 2 voor langere
  const threshold = domain.length >= 7 ? 2 : 1;
  if (best.dist > threshold) return null;
  return `${local}@${best.domain}`;
}
