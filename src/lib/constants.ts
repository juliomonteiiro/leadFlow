export const STANDARD_LEAD_FIELDS = [
  { key: 'email',     label: 'Email' },
  { key: 'phone',     label: 'Telefone' },
  { key: 'company',   label: 'Empresa' },
  { key: 'job_title', label: 'Cargo' },
  { key: 'source',    label: 'Origem' },
] as const

export type StandardFieldKey = typeof STANDARD_LEAD_FIELDS[number]['key']

export const LEAD_SOURCE_OPTIONS = [
  'LinkedIn',
  'Indicação',
  'Site',
  'Instagram',
  'WhatsApp',
  'Email',
  'Evento',
  'Outbound',
  'Outro',
] as const

export const STAGE_TRYING_CONTACT_NAME = 'Tentando Contato'
export const EDGE_FN_GENERATE_MESSAGES = 'generate-messages'
