// Single source of truth for the SMS consent language. The form renders it,
// and the API snapshots it into each sms_opt_in row — proof-of-consent
// requires recording the exact wording a person agreed to.
//
// Carriers require MARKETING consent to be collected separately from
// informational/transactional consent (Twilio campaign error 30913 — our
// first A2P submission was rejected for bundling them). So: two consents,
// two checkboxes, two stored snapshots. Never merge them back into one.

export const SMS_INFO_CONSENT_TEXT
  = 'By checking this box, I agree to receive informational and service text messages '
  + 'from Business Builder (a DBA of Donovan Farms Inc.) at the phone number provided: '
  + 'replies to my inquiry, appointment and consultation reminders, and project, hosting '
  + 'or billing updates. Message frequency varies. Message and data rates may apply. '
  + 'Reply STOP to opt out at any time. Reply HELP for assistance. Consent is not a '
  + 'condition of purchase.';

export const SMS_MARKETING_CONSENT_TEXT
  = 'By checking this box, I separately agree to receive marketing and promotional text '
  + 'messages from Business Builder (a DBA of Donovan Farms Inc.) at the phone number '
  + 'provided, such as occasional offers about our website, hosting and AI automation '
  + 'services. Message frequency varies. Message and data rates may apply. Reply STOP to '
  + 'opt out at any time. Reply HELP for assistance. Consent is not a condition of purchase.';
