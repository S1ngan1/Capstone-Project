import React, { useEffect, useState } from "react"
import { Modal, View, Text, FlatList, Pressable, StyleSheet } from "react-native"
import { supabase } from "../lib/supabase"
type Farm = {
  id: number
  name: string
}
type AddFarmProps = {
  visible: boolean
  onClose: () => void
  onSelect: (farm: Farm) => void
}
const AddFarm: React.FC<AddFarmProps> = ({ visible, onClose, onSelect }) => {
  const [farms, setFarms] = useState<Farm[]>([])
  useEffect(() => {
    const fetchFarms = async () => {
      const { data, error } = await supabase.from("farms").select("*")
      if (error) console.error(error)
      else setFarms(data as Farm[])
    }
    if (visible) fetchFarms()
  }, [visible])
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Farm List</Text>
          <FlatList
            data={farms}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Pressable
                style={styles.farmItem}
                onPress={() => {
                  onSelect(item)
                  onClose()
                }}
              >
                <Text>{item.name}</Text>
              </Pressable>
            )}
          />
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={{ color: "#fff" }}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
export default AddFarm
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  farmItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
})
