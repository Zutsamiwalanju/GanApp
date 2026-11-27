import React from 'react';
import { StyleSheet, Text as RNText, TextInput as RNTextInput, TextInputProps, TextProps } from 'react-native';

// Custom fonts need a separate family per weight (Android ignores fontWeight for them),
// so every Text in the app goes through this and picks the matching Inter file.
const FAMILY: Record<string, string> = {
  '100': 'Inter-Regular',
  '200': 'Inter-Regular',
  '300': 'Inter-Regular',
  '400': 'Inter-Regular',
  normal: 'Inter-Regular',
  '500': 'Inter-Medium',
  '600': 'Inter-SemiBold',
  '700': 'Inter-Bold',
  '800': 'Inter-Bold',
  '900': 'Inter-Bold',
  bold: 'Inter-Bold',
};

function fontFor(style: TextProps['style']) {
  const flat = StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily) return null; // explicit family wins (e.g. icon fonts)
  return { fontFamily: FAMILY[String(flat.fontWeight ?? '400')] ?? 'Inter-Regular', fontWeight: 'normal' as const };
}

export function Text(props: TextProps) {
  const f = fontFor(props.style);
  return <RNText {...props} style={f ? [props.style, f] : props.style} />;
}

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(function TextInput(props, ref) {
  const f = fontFor(props.style);
  return <RNTextInput ref={ref} {...props} style={f ? [props.style, f] : props.style} />;
});
