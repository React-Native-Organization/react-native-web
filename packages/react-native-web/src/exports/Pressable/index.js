/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type { PressResponderConfig } from '../../hooks/usePressEvents/PressResponder';
import type { ViewProps } from '../View';

import * as React from 'react';
import { forwardRef, memo, useMemo, useState, useRef } from 'react';
import setAndForwardRef from '../../modules/setAndForwardRef';
import usePressEvents from '../../hooks/usePressEvents';
import View from '../View';

export type StateCallbackType = $ReadOnly<{|
  focused: boolean,
  pressed: boolean
|}>;

type ViewStyleProp = $PropertyType<ViewProps, 'style'>;

type Props = $ReadOnly<{|
  accessibilityLabel?: $PropertyType<ViewProps, 'accessibilityLabel'>,
  accessibilityLiveRegion?: $PropertyType<ViewProps, 'accessibilityLiveRegion'>,
  accessibilityRole?: $PropertyType<ViewProps, 'accessibilityRole'>,
  accessibilityState?: $PropertyType<ViewProps, 'accessibilityState'>,
  accessibilityValue?: $PropertyType<ViewProps, 'accessibilityValue'>,
  accessible?: $PropertyType<ViewProps, 'accessible'>,
  focusable?: ?boolean,
  importantForAccessibility?: $PropertyType<ViewProps, 'importantForAccessibility'>,
  children: React.Node | ((state: StateCallbackType) => React.Node),
  // Duration (in milliseconds) from `onPressIn` before `onLongPress` is called.
  delayLongPress?: ?number,
  // Duration (in milliseconds) from `onPressStart` is called after pointerdown
  delayPressIn?: ?number,
  // Duration (in milliseconds) from `onPressEnd` is called after pointerup.
  delayPressOut?: ?number,
  // Whether the press behavior is disabled.
  disabled?: ?boolean,
  // Called when the view blurs
  onBlur?: $PropertyType<ViewProps, 'onBlur'>,
  // Called when the view is focused
  onFocus?: $PropertyType<ViewProps, 'onFocus'>,
  // Called when this view's layout changes
  onLayout?: $PropertyType<ViewProps, 'onLayout'>,
  // Called when a long-tap gesture is detected.
  onLongPress?: $PropertyType<PressResponderConfig, 'onLongPress'>,
  // Called when a single tap gesture is detected.
  onPress?: $PropertyType<PressResponderConfig, 'onPress'>,
  // Called when a touch is engaged, before `onPress`.
  onPressIn?: $PropertyType<PressResponderConfig, 'onPressStart'>,
  // Called when a touch is moving, after `onPressIn`.
  onPressMove?: $PropertyType<PressResponderConfig, 'onPressMove'>,
  // Called when a touch is released, before `onPress`.
  onPressOut?: $PropertyType<PressResponderConfig, 'onPressEnd'>,
  style?: ViewStyleProp | ((state: StateCallbackType) => ViewStyleProp),
  testID?: $PropertyType<ViewProps, 'testID'>,
  /**
   * Used only for documentation or testing (e.g. snapshot testing).
   */
  testOnly_pressed?: ?boolean
|}>;

/**
 * Component used to build display components that should respond to whether the
 * component is currently pressed or not.
 */
function Pressable(props: Props, forwardedRef): React.Node {
  const {
    accessible,
    children,
    delayLongPress,
    delayPressIn,
    delayPressOut,
    disabled,
    focusable,
    onBlur,
    onFocus,
    onLongPress,
    onPress,
    onPressMove,
    onPressIn,
    onPressOut,
    style,
    testOnly_pressed,
    ...rest
  } = props;

  const [focused, setFocused] = useForceableState(false);
  const [pressed, setPressed] = useForceableState(testOnly_pressed === true);

  const hostRef = useRef(null);
  const setRef = setAndForwardRef({
    getForwardedRef: () => forwardedRef,
    setLocalRef: hostNode => {
      hostRef.current = hostNode;
    }
  });

  const pressConfig = useMemo(
    () => ({
      delayLongPress,
      delayPressStart: delayPressIn,
      delayPressEnd: delayPressOut,
      disabled,
      onLongPress,
      onPress,
      onPressChange: setPressed,
      onPressStart: onPressIn,
      onPressMove,
      onPressEnd: onPressOut
    }),
    [
      delayLongPress,
      delayPressIn,
      delayPressOut,
      disabled,
      onLongPress,
      onPress,
      onPressIn,
      onPressMove,
      onPressOut,
      setPressed
    ]
  );

  const pressEventHandlers = usePressEvents(hostRef, pressConfig);

  const accessibilityState = { disabled, ...props.accessibilityState };
  const interactionState = { focused, pressed };

  function createFocusHandler(callback, value) {
    return function(event) {
      if (event.nativeEvent.target === hostRef.current) {
        setFocused(value);
        if (callback != null) {
          callback(event);
        }
      }
    };
  }

  return (
    <View
      {...rest}
      {...pressEventHandlers}
      accessibilityState={accessibilityState}
      accessible={accessible !== false}
      focusable={focusable !== false}
      onBlur={createFocusHandler(onBlur, false)}
      onFocus={createFocusHandler(onFocus, true)}
      ref={setRef}
      style={typeof style === 'function' ? style(interactionState) : style}
    >
      {typeof children === 'function' ? children(interactionState) : children}
    </View>
  );
}

function useForceableState(forced: boolean): [boolean, (boolean) => void] {
  const [pressed, setPressed] = useState(false);
  return [pressed || forced, setPressed];
}

const MemoedPressable = memo(forwardRef(Pressable));
MemoedPressable.displayName = 'Pressable';

export default (MemoedPressable: React.AbstractComponent<Props, React.ElementRef<typeof View>>);
