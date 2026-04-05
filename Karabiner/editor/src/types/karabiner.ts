// Karabiner-Elements JSON schema type definitions

export type KeyCode =
  | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm'
  | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z'
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'spacebar' | 'return_or_enter' | 'escape' | 'delete_or_backspace' | 'delete_forward'
  | 'tab' | 'caps_lock' | 'left_shift' | 'right_shift' | 'left_control' | 'right_control'
  | 'left_option' | 'right_option' | 'left_command' | 'right_command'
  | 'up_arrow' | 'down_arrow' | 'left_arrow' | 'right_arrow'
  | 'page_up' | 'page_down' | 'home' | 'end'
  | 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6' | 'f7' | 'f8' | 'f9' | 'f10' | 'f11' | 'f12'
  | 'f13' | 'f14' | 'f15' | 'f16' | 'f17' | 'f18' | 'f19' | 'f20'
  | 'grave_accent_and_tilde' | 'minus' | 'equal' | 'left_bracket' | 'right_bracket'
  | 'backslash' | 'semicolon' | 'quote' | 'comma' | 'period' | 'slash'
  | 'open_bracket' | 'close_bracket'
  | string;

export type ModifierKey =
  | 'left_shift' | 'right_shift' | 'shift'
  | 'left_control' | 'right_control' | 'control'
  | 'left_option' | 'right_option' | 'option'
  | 'left_command' | 'right_command' | 'command'
  | 'caps_lock' | 'fn'
  | 'any';

export interface ModifierRequirement {
  mandatory?: ModifierKey[];
  optional?: ModifierKey[];
}

export interface FromEvent {
  key_code?: KeyCode;
  pointing_button?: 'button1' | 'button2' | 'button3' | 'button4' | 'button5';
  simultaneous?: Array<{ key_code: KeyCode } | { pointing_button: string }>;
  modifiers?: ModifierRequirement;
}

export interface ToEvent {
  key_code?: KeyCode;
  pointing_button?: string;
  modifiers?: ModifierKey[];
  shell_command?: string;
  set_variable?: { name: string; value: number; key_up_value?: number };
  select_input_source?: { language?: string; input_source_id?: string };
  repeat?: boolean;
  hold_down_milliseconds?: number;
}

export interface Condition {
  type: string;
  name?: string;
  value?: number;
  bundle_identifiers?: string[];
  input_sources?: Array<{ language?: string; input_source_id?: string }>;
  description?: string;
}

export interface Manipulator {
  type: 'basic';
  description?: string;
  from: FromEvent;
  to?: ToEvent[];
  to_if_alone?: ToEvent[];
  to_if_held_down?: ToEvent[];
  to_after_key_up?: ToEvent[];
  to_delayed_action?: {
    to_if_invoked: ToEvent[];
    to_if_canceled: ToEvent[];
  };
  conditions?: Condition[];
  parameters?: Record<string, number>;
}

export interface Rule {
  description: string;
  manipulators: Manipulator[];
}

export interface KarabinerConfig {
  title?: string;
  url?: string;
  version?: string;
  maintainers?: string[];
  author?: string;
  json_url?: string;
  import_url?: string;
  repo?: string;
  rules: Rule[];
}
