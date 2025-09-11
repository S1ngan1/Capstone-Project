// components/ConfirmLogoutDialog.tsx
import React from 'react'
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native'
import { ConfirmDialogProps } from '../../interfaces/Auth'
export default function ConfirmLogoutDialog({ visible, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Confirm Log Out?</Text>
          <View style={styles.buttons}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onCancel}>
              <Text style={styles.text}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.confirm]} onPress={onConfirm}>
              <Text style={[styles.text, { color: 'red' }]}>Log Out</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: '#0e3d2a',
    padding: 20,
    borderRadius: 12,
    width: 280,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    color: 'white',
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#185a42',
  },
  cancel: {},
  confirm: {
    backgroundColor: '#133d2f',
  },
  text: {
    color: 'white',
    fontWeight: '600',
  },
})
