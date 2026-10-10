import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { COLORS } from '../styles/theme';

export default function BuyerProfile() {
  const { currentUser, buyerRequirements, logout } = useContext(AppContext);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buyer Profile</Text>
        <Text style={styles.headerSub}>Account info & factory certifications</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="cart" size={28} color="#FFFFFF" />
          </View>

          <Text style={styles.companyName}>{currentUser?.company || 'Vogue Garments Ltd'}</Text>
          <Text style={styles.userName}>{currentUser?.name || 'Vikram Singhania'}</Text>
          <View style={styles.idBadge}>
            <Text style={styles.idBadgeText}>VERIFIED BUYER ID: {currentUser?.id || 'BUYER-501'}</Text>
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>BUYER ACCOUNT DETAILS</Text>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={COLORS.primary} style={styles.infoIcon} />
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Official Email</Text>
              <Text style={styles.infoVal}>{currentUser?.email || 'vikram@voguegarments.com'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="bag-handle-outline" size={18} color={COLORS.primary} style={styles.infoIcon} />
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Total Inquiries Submitted</Text>
              <Text style={styles.infoVal}>{buyerRequirements.length} Bulk Orders</Text>
            </View>
          </View>
        </View>

        {/* Factory Certifications */}
        <View style={styles.certCard}>
          <Text style={styles.cardTitle}>FACTORY QUALITY CERTIFICATIONS</Text>

          <View style={styles.certRow}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} style={{ marginRight: 8 }} />
            <Text style={styles.certText}>ISO 9001:2025 Quality Management System</Text>
          </View>

          <View style={styles.certRow}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} style={{ marginRight: 8 }} />
            <Text style={styles.certText}>GOTS Global Organic Textile Standard</Text>
          </View>

          <View style={styles.certRow}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} style={{ marginRight: 8 }} />
            <Text style={styles.certText}>Oeko-Tex Standard 100 Non-Toxic Certified</Text>
          </View>

          <TouchableOpacity
            style={styles.brochureBtn}
            onPress={() => alert('Product Catalog PDF downloaded to device!')}
            activeOpacity={0.85}
          >
            <Ionicons name="document-text-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.brochureBtnText}>DOWNLOAD FACTORY BROCHURE PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Exit Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>LOGOUT FROM BUYER PORTAL</Text>
        </TouchableOpacity>
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
    maxWidth: 550,
    alignSelf: 'center',
    width: '100%',
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
  },
  userName: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
  idBadge: {
    backgroundColor: COLORS.canvas,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  idBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.muted,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoTextGroup: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.muted,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 10,
  },
  certCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  certText: {
    fontSize: 12,
    color: COLORS.ink,
    fontWeight: '600',
  },
  brochureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  brochureBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
