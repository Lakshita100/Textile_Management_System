import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { COLORS } from '../styles/theme';

export default function BuyerExplore({ onNavigateToOrders }) {
  const {
    currentUser,
    textiles,
    postBuyerRequirement,
    logout,
  } = useContext(AppContext);

  const { width } = useWindowDimensions();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState('Premium Ring Cotton Denim');
  const [quantity, setQuantity] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('15 Nov 2026');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOpenPostModal = (fabricName) => {
    if (fabricName) setSelectedFabric(fabricName);
    setModalVisible(true);
  };

  const handleSubmitOrder = () => {
    if (!quantity) {
      alert('Please enter required quantity in meters');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      postBuyerRequirement({
        fabricType: selectedFabric,
        quantity,
        targetPrice: targetPrice ? `₹${targetPrice}/m` : 'Market Rate',
        deliveryDate,
        notes,
      });

      setSubmitting(false);
      setModalVisible(false);
      setQuantity('');
      setTargetPrice('');
      setNotes('');
      if (onNavigateToOrders) onNavigateToOrders();
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="cart" size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brandTitle}>{currentUser?.company || 'VOGUE GARMENTS LTD'}</Text>
            <Text style={styles.brandSub}>Buyer: {currentUser?.name || 'Vikram Singhania'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.exitBtn} onPress={logout}>
          <Feather name="log-out" size={16} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HERO BANNER: ORDER AS PER YOUR REQUIREMENT */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.heroBadgeText}>FACTORY DIRECT ORDERS</Text>
          </View>
          <Text style={styles.heroTitle}>Order Fabrics As Per Your Requirement</Text>
          <Text style={styles.heroSub}>
            Custom GSM, weave patterns, color dyeing, and bulk quantity manufacturing.
          </Text>

          <TouchableOpacity
            style={styles.heroActionBtn}
            onPress={() => handleOpenPostModal()}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.heroActionText}>POST CUSTOM REQUIREMENT</Text>
          </TouchableOpacity>
        </View>

        {/* FACTORY PRODUCTS GLIMPSES */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Textile Products & Glimpses</Text>
          <Text style={styles.sectionSubCount}>{textiles.length} Featured Collections</Text>
        </View>

        {textiles.map((item) => (
          <View key={item.id} style={styles.productCard}>
            <Image source={{ uri: item.image }} style={styles.productImage} />

            <View style={styles.productDetails}>
              <View style={styles.catTag}>
                <Text style={styles.catTagText}>{item.category.toUpperCase()}</Text>
              </View>

              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>{item.price}</Text>

              <Text style={styles.productDesc}>{item.description}</Text>

              <View style={styles.specBox}>
                <Ionicons name="options-outline" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.specText}>{item.specs}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>MOQ: {item.moq}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>Weight: {item.gsm} GSM</Text>
              </View>

              <TouchableOpacity
                style={styles.orderBtn}
                onPress={() => handleOpenPostModal(item.name)}
                activeOpacity={0.8}
              >
                <Ionicons name="cart-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.orderBtnText}>Order This Fabric →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* POST REQUIREMENT MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Post Custom Requirement</Text>
                <Text style={styles.modalSub}>Direct inquiry to factory production team</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Selected Fabric</Text>
              <TextInput style={styles.inputDisabled} value={selectedFabric} editable={false} />

              <Text style={styles.formLabel}>Required Quantity (Meters / Yards)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1000 meters"
                placeholderTextColor={COLORS.muted}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />

              <Text style={styles.formLabel}>Target Price Per Meter (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 220"
                placeholderTextColor={COLORS.muted}
                keyboardType="numeric"
                value={targetPrice}
                onChangeText={setTargetPrice}
              />

              <Text style={styles.formLabel}>Target Delivery Date</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 15 Nov 2026"
                placeholderTextColor={COLORS.muted}
                value={deliveryDate}
                onChangeText={setDeliveryDate}
              />

              <Text style={styles.formLabel}>Custom Specifications / Color Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Specify shade, finish, yarn count or weaving requirements..."
                placeholderTextColor={COLORS.muted}
                multiline={true}
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleSubmitOrder}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Text style={styles.submitModalBtnText}>
                  {submitting ? 'SUBMITTING...' : 'SUBMIT BULK ORDER INQUIRY'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 42,
    paddingHorizontal: 18,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandSub: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  exitBtn: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
    maxWidth: 550,
    alignSelf: 'center',
    width: '100%',
  },
  heroCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#172B45',
    elevation: 4,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    marginBottom: 6,
  },
  heroSub: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 10,
  },
  heroActionText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.ink,
  },
  sectionSubCount: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 160,
    backgroundColor: COLORS.canvas,
  },
  productDetails: {
    padding: 16,
  },
  catTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.canvas,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  catTagText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '900',
  },
  productName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.success,
    marginTop: 2,
    marginBottom: 6,
  },
  productDesc: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 17,
    marginBottom: 10,
  },
  specBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.canvas,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  specText: {
    fontSize: 11,
    color: COLORS.ink,
    fontWeight: '600',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.muted,
  },
  metaDot: {
    marginHorizontal: 8,
    color: COLORS.muted,
  },
  orderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 12,
    borderRadius: 10,
  },
  orderBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
  },
  modalSub: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: COLORS.canvas,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.muted,
    marginBottom: 6,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.canvas,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: COLORS.ink,
  },
  inputDisabled: {
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  submitModalBtn: {
    backgroundColor: COLORS.success,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitModalBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
