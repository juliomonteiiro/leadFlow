export interface Workspace {
  id:         string
  name:       string
  created_at: string
}

export interface Profile {
  id:        string
  full_name: string
  email:     string
  created_at: string
}

export interface WorkspaceMember {
  id:           string
  workspace_id: string
  user_id:      string
  role:         'admin' | 'member'
  joined_at:    string
  profiles:     Profile | null
}

export interface FunnelStage {
  id:           string
  workspace_id: string
  name:         string
  position:     number
  color:        string
  created_at:   string
}

export type FieldType = 'text' | 'number' | 'date' | 'select'

export interface CustomFieldDefinition {
  id:           string
  workspace_id: string
  name:         string
  field_type:   FieldType
  options:      string[]
  position:     number
  created_at:   string
}

export interface Lead {
  id:           string
  workspace_id: string
  stage_id:     string
  assigned_to:  string | null
  name:         string
  email:        string
  phone:        string
  company:      string
  job_title:    string
  source:       string
  notes:        string
  created_at:   string
  updated_at:   string
}

export interface LeadCustomValue {
  id:       string
  lead_id:  string
  field_id: string
  value:    string
}

export interface StageRequiredField {
  id:              string
  stage_id:        string
  standard_field:  string | null
  custom_field_id: string | null
}

export interface Campaign {
  id:               string
  workspace_id:     string
  trigger_stage_id: string | null
  name:             string
  context:          string
  prompt:           string
  is_active:        boolean
  created_at:       string
  updated_at:       string
}

export interface GeneratedMessage {
  id:             string
  lead_id:        string
  campaign_id:    string
  variations:     string[]
  was_sent:       boolean
  sent_at:        string | null
  sent_variation: number | null
  auto_generated: boolean
  created_at:     string
}

export interface ActivityLog {
  id:            string
  workspace_id:  string
  lead_id:       string | null
  user_id:       string | null
  activity_type: ActivityType
  metadata:      Record<string, unknown>
  created_at:    string
}

export type ActivityType =
  | 'lead_created'
  | 'stage_changed'
  | 'message_generated'
  | 'message_sent'
  | 'lead_updated'
