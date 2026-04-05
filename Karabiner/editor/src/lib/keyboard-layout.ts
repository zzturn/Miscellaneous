/** Mac 键盘布局定义 — 用于虚拟键盘组件 */

export interface KeyDef {
  id: string;           // key_code 标识符
  label: string;        // 显示标签
  width?: number;       // 宽度单位（1 = 标准），默认 1
  shift?: string;       // Shift 层标签（如 ! @ # 等）
  spacer?: boolean;     // 是否为间隔占位符（不渲染为按键）
}

/**
 * 87 键 TKL (Tenkeyless) ANSI 键盘布局 — 6 行
 *
 * 对齐规则：
 * - 主键区固定 15u 宽（字母/数字/修饰键行）
 * - 导航区在主键区右侧，间隔 0.25u
 * - 功能行 Esc+F1-F12 共 15u，和数字行对齐
 * - 方向键区域居中对齐导航区
 * - 所有行都加右侧 padding spacer 使同栏等宽
 */

/** 所有行的右侧 padding：统一补到 max 宽度 */
const PAD = 0; // 不需要额外 pad，各行自身已对齐

export const KEYBOARD_ROWS: KeyDef[][] = [
  // ═══════ Row 0: 功能键行 ═══════
  // Esc(1) + gap(1) + F1-F4(4) + gap(0.5) + F5-F8(4) + gap(0.5) + F9-F12(4) = 15u
  [
    { id: 'escape', label: 'Esc', width: 1 },
    { id: '_s0', label: '', spacer: true, width: 1 },
    { id: 'f1', label: 'F1' },
    { id: 'f2', label: 'F2' },
    { id: 'f3', label: 'F3' },
    { id: 'f4', label: 'F4' },
    { id: '_s1', label: '', spacer: true, width: 0.5 },
    { id: 'f5', label: 'F5' },
    { id: 'f6', label: 'F6' },
    { id: 'f7', label: 'F7' },
    { id: 'f8', label: 'F8' },
    { id: '_s2', label: '', spacer: true, width: 0.5 },
    { id: 'f9', label: 'F9' },
    { id: 'f10', label: 'F10' },
    { id: 'f11', label: 'F11' },
    { id: 'f12', label: 'F12' },
    { id: '_pad0', label: '', spacer: true, width: 3.25 },
  ],

  // ═══════ Row 1: 数字行 + 导航区上半 ═══════
  // 主键区 15u: `(1)+1-0(10)+-(1)+=(1)+Backspace(2)
  // 间隔 0.25u + 导航 3u: Ins(1)+Home(1)+PgUp(1)
  [
    { id: 'grave_accent_and_tilde', label: '`', shift: '~', width: 1 },
    { id: '1', label: '1', shift: '!', width: 1 },
    { id: '2', label: '2', shift: '@', width: 1 },
    { id: '3', label: '3', shift: '#', width: 1 },
    { id: '4', label: '4', shift: '$', width: 1 },
    { id: '5', label: '5', shift: '%', width: 1 },
    { id: '6', label: '6', shift: '^', width: 1 },
    { id: '7', label: '7', shift: '&', width: 1 },
    { id: '8', label: '8', shift: '*', width: 1 },
    { id: '9', label: '9', shift: '(', width: 1 },
    { id: '0', label: '0', shift: ')', width: 1 },
    { id: 'minus', label: '-', shift: '_', width: 1 },
    { id: 'equal', label: '=', shift: '+', width: 1 },
    { id: 'delete_or_backspace', label: '⌫', width: 2 },
    { id: '_s3', label: '', spacer: true, width: 0.25 },
    { id: 'insert', label: 'Ins', width: 1 },
    { id: 'home', label: 'Home', width: 1 },
    { id: 'page_up', label: 'PgUp', width: 1 },
  ],

  // ═══════ Row 2: QWERTY 行 + 导航区下半 ═══════
  // 主键区 15u: Tab(1.5)+Q-P(10)+[(1)+](1)+\(1.5)
  // 间隔 0.25u + 导航 3u: Del(1)+End(1)+PgDn(1)
  [
    { id: 'tab', label: 'Tab', width: 1.5 },
    { id: 'q', label: 'Q' },
    { id: 'w', label: 'W' },
    { id: 'e', label: 'E' },
    { id: 'r', label: 'R' },
    { id: 't', label: 'T' },
    { id: 'y', label: 'Y' },
    { id: 'u', label: 'U' },
    { id: 'i', label: 'I' },
    { id: 'o', label: 'O' },
    { id: 'p', label: 'P' },
    { id: 'left_bracket', label: '[', shift: '{' },
    { id: 'right_bracket', label: ']', shift: '}' },
    { id: 'backslash', label: '\\', shift: '|', width: 1.5 },
    { id: '_s4', label: '', spacer: true, width: 0.25 },
    { id: 'forward_delete', label: 'Del', width: 1 },
    { id: 'end', label: 'End', width: 1 },
    { id: 'page_down', label: 'PgDn', width: 1 },
  ],

  // ═══════ Row 3: Home 行（CapsLock 所在行）═══════
  // 主键区 15u: CapsLock(1.75)+A-'(10)+Enter(2.25)
  // 此行无导航区，右侧空白对齐
  [
    { id: 'caps_lock', label: '⇪', width: 1.75 },
    { id: 'a', label: 'A' },
    { id: 's', label: 'S' },
    { id: 'd', label: 'D' },
    { id: 'f', label: 'F' },
    { id: 'g', label: 'G' },
    { id: 'h', label: 'H' },
    { id: 'j', label: 'J' },
    { id: 'k', label: 'K' },
    { id: 'l', label: 'L' },
    { id: 'semicolon', label: ';', shift: ':' },
    { id: 'quote', label: "'", shift: '"' },
    { id: 'return_or_enter', label: '↵', width: 2.25 },
    { id: '_pad3', label: '', spacer: true, width: 3.25 },
  ],

  // ═══════ Row 4: Shift 行 + ↑ ═══════
  // 主键区 15u: LShift(2.25)+Z-/(10)+RShift(2.75)
  // 间隔 + ↑: spacer(1.25) + ↑(1) — ↑ 居中对齐导航区中间列
  [
    { id: 'left_shift', label: '⇧', width: 2.25 },
    { id: 'z', label: 'Z' },
    { id: 'x', label: 'X' },
    { id: 'c', label: 'C' },
    { id: 'v', label: 'V' },
    { id: 'b', label: 'B' },
    { id: 'n', label: 'N' },
    { id: 'm', label: 'M' },
    { id: 'comma', label: ',', shift: '<' },
    { id: 'period', label: '.', shift: '>' },
    { id: 'slash', label: '/', shift: '?' },
    { id: 'right_shift', label: '⇧', width: 2.75 },
    { id: '_s5', label: '', spacer: true, width: 1.25 },
    { id: 'up_arrow', label: '↑', width: 1 },
    { id: '_pad4', label: '', spacer: true, width: 1 },
  ],

  // ═══════ Row 5: 底部行 + 方向键 ═══════
  // 主键区 13.75u: Ctrl(1.25)+Alt(1.25)+Cmd(1.25)+Space(6.25)+Cmd(1.25)+Alt(1.25)+Fn(1.25)
  // 缺口 1.25u + 间隔 0.25u = 1.5u spacer 到导航区
  // 导航区 3u: ←(1)+↓(1)+→(1)
  [
    { id: 'left_control', label: '⌃', width: 1.25 },
    { id: 'left_option', label: '⌥', width: 1.25 },
    { id: 'left_command', label: '⌘', width: 1.25 },
    { id: 'spacebar', label: '', width: 6.25 },
    { id: 'right_command', label: '⌘', width: 1.25 },
    { id: 'right_option', label: '⌥', width: 1.25 },
    { id: 'fn', label: 'Fn', width: 1.25 },
    { id: '_s6', label: '', spacer: true, width: 1.5 },
    { id: 'left_arrow', label: '←', width: 1 },
    { id: 'down_arrow', label: '↓', width: 1 },
    { id: 'right_arrow', label: '→', width: 1 },
  ],
];

/** 所有可绑定的字母键（Hyper 层主键区） */
export const HYPER_KEY_ZONE = new Set([
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'spacebar', 'comma', 'period', 'slash', 'semicolon', 'quote',
  'tab', 'escape',
]);

/** 方向键名称映射 */
export const ARROW_NAMES: Record<string, string> = {
  left_arrow: '←',
  right_arrow: '→',
  up_arrow: '↑',
  down_arrow: '↓',
};
