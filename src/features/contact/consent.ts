// Single source of truth for the SMS consent language. The form renders it,
// and the API snapshots it into each sms_opt_in row — proof-of-consent
// requires recording the exact wording a person agreed to.
export const SMS_CONSENT_TEXT
  = 'By checking this box, I agree to receive text messages from Business Builder '
  + '(a DBA of Donovan Farms Inc.) at the phone number provided, including follow-up '
  + 'messages about my inquiry, appointment reminders, and occasional promotional offers. '
  + 'Message frequency varies. Message and data rates may apply. Reply STOP to opt out at '
  + 'any time. Reply HELP for assistance. Consent is not a condition of purchase.';
