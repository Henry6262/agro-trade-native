import React from 'react';
import {
  View,
  Text,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { BaseComponentProps } from '../../shared/types';

interface ModalProps extends BaseComponentProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full';
  closable?: boolean;
  overlayClosable?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  size = 'medium',
  closable = true,
  overlayClosable = true,
  testID,
  accessibilityLabel,
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: Math.min(300, screenWidth * 0.8),
          maxHeight: screenHeight * 0.7,
        };
      case 'large':
        return {
          width: Math.min(600, screenWidth * 0.9),
          maxHeight: screenHeight * 0.85,
        };
      case 'full':
        return {
          width: screenWidth * 0.95,
          maxHeight: screenHeight * 0.9,
        };
      default: // medium
        return {
          width: Math.min(400, screenWidth * 0.85),
          maxHeight: screenHeight * 0.8,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const handleOverlayPress = () => {
    if (overlayClosable) {
      onClose();
    }
  };

  const handleContentPress = (e: any) => {
    // Prevent the modal from closing when touching the content
    e.stopPropagation();
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <TouchableWithoutFeedback onPress={handleContentPress}>
            <View
              className="bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden"
              style={sizeStyles}
            >
              {/* Header */}
              {(title || closable) && (
                <View className="flex-row items-center justify-between p-4 border-b border-neutral-700">
                  {title && (
                    <Text className="text-lg font-semibold text-white flex-1 mr-4">{title}</Text>
                  )}
                  {closable && (
                    <TouchableOpacity
                      onPress={onClose}
                      className="w-8 h-8 rounded-full bg-neutral-800 items-center justify-center"
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Content */}
              <View className="flex-1">{children}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};
