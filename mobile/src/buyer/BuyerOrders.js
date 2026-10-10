import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { COLORS } from '../styles/theme';

export default function BuyerOrders() {
  const { buyerRequirements } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = buyerRequirements.filter(
    (item) =>
      item.fabricType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const STAGES = ['Inquiry', 'Quotation', 'Production', 'QC', 'Dispatched'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders & Live Tracker</Text>
        <Text style={styles.headerSub}>Track production & delivery status of bulk inquiries</Text>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search order ID or fabric..."
            placeholderTextColor={COLORS.muted}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bag-handle-outline" size={36} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySub}>Your submitted bulk fabric requirements will appear here for live tracking.</Text>
          </View>
        ) : (
          filteredOrders.map((req) => (
            <View key={req.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>{req.id}</Text>
                  <Text style={styles.orderDate}>Submitted: {req.date}</Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{req.status}</Text>
                </View>
              </View>

              <Text style={styles.fabricTitle}>{req.fabricType}</Text>

              <View style={styles.detailsRow}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>QUANTITY</Text>
                  <Text style={styles.detailVal}>{req.quantity} meters</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>TARGET PRICE</Text>
                  <Text style={styles.detailValGreen}>{req.targetPrice}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>DELIVERY</Text>
                  <Text style={styles.detailVal}>{req.deliveryDate}</Text>
                </View>
              </View>

              {/* LIVE ORDER TRACKER PIPELINE */}
              <View style={styles.trackerContainer}>
                <Text style={styles.trackerTitle}>LIVE PRODUCTION PIPELINE</Text>
                <View style={styles.pipelineRow}>
                  {STAGES.map((stage, idx) => {
                    const isPassed = idx <= 1; // Demo progress
                    return (
                      <View key={stage} style={styles.stageItem}>
                        <View
                          style={[
                            styles.stepCircle,
                            isPassed ? styles.stepPassed : styles.stepPending,
                          ]}
                        >
                          <Ionicons
                            name={isPassed ? 'checkmark' : 'ellipse'}
                            size={10}
                            color={isPassed ? '#FFFFFF' : COLORS.muted}
                          />
                        </View>
                        <Text style={[styles.stepText, isPassed && styles.stepTextPassed]}>
                          {stage}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {req.notes ? <Text style={styles.notesText}>Note: "{req.notes}"</Text> : null}
            </View>
          ))
        )}
      </ScrollView>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#172B45',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#264268',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
    maxWidth: 550,
    alignSelf: 'center',
    width: '100%',
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
  },
  orderDate: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 1,
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
  },
  fabricTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.canvas,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  detailCol: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.muted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  detailValGreen: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.success,
  },
  trackerContainer: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: COLORS.line,
  },
  trackerTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.muted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  pipelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stageItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepPassed: {
    backgroundColor: COLORS.success,
  },
  stepPending: {
    backgroundColor: COLORS.line,
  },
  stepText: {
    fontSize: 9,
    color: COLORS.muted,
    fontWeight: '600',
  },
  stepTextPassed: {
    color: COLORS.success,
    fontWeight: '800',
  },
  notesText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: COLORS.muted,
    marginTop: 10,
  },
});
