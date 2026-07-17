import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography } from '../theme';

const ALL_DEPARTMENTS = [
  'Computer Science',
  'Engineering',
  'Mathematics',
  'Physics',
  'Business',
  'Medicine',
  'Law',
];

const TURKISH_UNIVERSITIES = [
  'Abdullah Gül Üniversitesi',
  'Acıbadem Mehmet Ali Aydınlar Üniversitesi',
  'Adana Alparslan Türkeş Bilim Ve Teknoloji Üniversitesi',
  'Adıyaman Üniversitesi',
  'Afyonkarahisar Sağlık Bilimleri Üniversitesi',
  'Afyon Kocatepe Üniversitesi',
  'Ağrı İbrahim Çeçen Üniversitesi',
  'Ahmet Yesevi Üniversitesi',
  'Akdeniz Üniversitesi',
  'Aksaray Üniversitesi',
  'Alanya Alaaddin Keykubat Üniversitesi',
  'Alanya Üniversitesi',
  'Altınbaş Üniversitesi',
  'Amasya Üniversitesi',
  'Anadolu Üniversitesi',
  'Ankara Bilim Üniversitesi',
  'Ankara Hacı Bayram Veli Üniversitesi',
  'Ankara Medipol Üniversitesi',
  'Ankara Müzik ve Güzel Sanatlar Üniversitesi',
  'Ankara Sosyal Bilimler Üniversitesi',
  'Ankara Üniversitesi',
  'Ankara Yıldırım Beyazıt Üniversitesi',
  'Antalya Belek Üniversitesi',
  'Antalya Bilim Üniversitesi',
  'Ardahan Üniversitesi',
  'Artvin Çoruh Üniversitesi',
  'Ataşehir Adıgüzel Meslek Yüksekokulu',
  'Atatürk Üniversitesi',
  'Atılım Üniversitesi',
  'Avrasya Üniversitesi',
  'Aydın Adnan Menderes Üniversitesi',
  'Bahçeşehir Üniversitesi',
  'Balıkesir Üniversitesi',
  'Bandırma Onyedi Eylül Üniversitesi',
  'Bartın Üniversitesi',
  'Başkent Üniversitesi',
  'Batman Üniversitesi',
  'Bayburt Üniversitesi',
  'Çağ Üniversitesi',
  'Çanakkale Onsekiz Mart Üniversitesi',
  'Çankaya Üniversitesi',
  'Çankırı Karatekin Üniversitesi',
  'Çukurova Üniversitesi',
  'Demiroğlu Bilim Üniversitesi',
  'Dicle Üniversitesi',
  'Doğuş Üniversitesi',
  'Dokuz Eylül Üniversitesi',
  'Düzce Üniversitesi',
  'Ege Üniversitesi',
  'Erciyes Üniversitesi',
  'Erzincan Binali Yıldırım Üniversitesi',
  'Erzurum Teknik Üniversitesi',
  'Eskişehir Osmangazi Üniversitesi',
  'Eskişehir Teknik Üniversitesi',
  'Fatih Sultan Mehmet Vakıf Üniversitesi',
  'Fenerbahçe Üniversitesi',
  'Fırat Üniversitesi',
  'Galatasaray Üniversitesi',
  'Gaziantep İslam Bilim ve Teknoloji Üniversitesi',
  'Gaziantep Üniversitesi',
  'Gazi Üniversitesi',
  'Gebze Teknik Üniversitesi',
  'Giresun Üniversitesi',
  'Gümüşhane Üniversitesi',
  'Hacettepe Üniversitesi',
  'Hakkari Üniversitesi',
  'Haliç Üniversitesi',
  'Harran Üniversitesi',
  'Hasan Kalyoncu Üniversitesi',
  'Hatay Mustafa Kemal Üniversitesi',
  'Hitit Üniversitesi',
  'Iğdır Üniversitesi',
  'Isparta Uygulamalı Bilimler Üniversitesi',
  'Işık Üniversitesi',
  'İbn Haldun Üniversitesi',
  'İhsan Doğramacı Bilkent Üniversitesi',
  'İnönü Üniversitesi',
  'İskenderun Teknik Üniversitesi',
  'İstanbul 29 Mayıs Üniversitesi',
  'İstanbul Arel Üniversitesi',
  'İstanbul Atlas Üniversitesi',
  'İstanbul Aydın Üniversitesi',
  'İstanbul Beykent Üniversitesi',
  'İstanbul Bilgi Üniversitesi',
  'İstanbul Esenyurt Üniversitesi',
  'İstanbul Galata Üniversitesi',
  'İstanbul Gedik Üniversitesi',
  'İstanbul Gelişim Üniversitesi',
  'İstanbul Kent Üniversitesi',
  'İstanbul Kültür Üniversitesi',
  'İstanbul Medeniyet Üniversitesi',
  'İstanbul Medipol Üniversitesi',
  'İstanbul Nişantaşı Üniversitesi',
  'İstanbul Okan Üniversitesi',
  'İstanbul Rumeli Üniversitesi',
  'İstanbul Sabahattin Zaim Üniversitesi',
  'İstanbul Sağlık ve Sosyal Bilimler Meslek Yüksekokulu',
  'İstanbul Sağlık ve Teknoloji Üniversitesi',
  'İstanbul Şişli Meslek Yüksekokulu',
  'İstanbul Teknik Üniversitesi',
  'İstanbul Ticaret Üniversitesi',
  'İstanbul Topkapı Üniversitesi',
  'İstanbul Üniversitesi',
  'İstanbul Üniversitesi-Cerrahpaşa',
  'Kırıkkale Üniversitesi',
  'Kırklareli Üniversitesi',
  'Kırşehir Ahi Evran Üniversitesi',
  'Kilis 7 Aralık Üniversitesi',
  'Kocaeli Sağlık ve Teknoloji Üniversitesi',
  'Kocaeli Üniversitesi',
  'Koç Üniversitesi',
  'Konya Gıda ve Tarım Üniversitesi',
  'Konya Teknik Üniversitesi',
  'KTO-Karatay Üniversitesi',
  'Kütahya Dumlupınar Üniversitesi',
  'Kütahya Sağlık Bilimleri Üniversitesi',
  'Lokman Hekim Üniversitesi',
  'Malatya Turgut Özal Üniversitesi',
  'Maltepe Üniversitesi',
  'Manisa Celal Bayar Üniversitesi',
  'Mardin Artuklu Üniversitesi',
  'Marmara Üniversitesi',
  'MEF Üniversitesi',
  'Mersin Üniversitesi',
  'Mimar Sinan Güzel Sanatlar Üniversitesi',
  'Mudanya Üniversitesi',
  'Muğla Sıtkı Koçman Üniversitesi',
  'Munzur Üniversitesi',
  'Muş Alparslan Üniversitesi',
  'Necmettin Erbakan Üniversitesi',
  'Nevşehir Hacı Bektaş Veli Üniversitesi',
  'Niğde Ömer Halisdemir Üniversitesi',
  'Nuh Naci Yazgan Üniversitesi',
  'Ondokuz Mayıs Üniversitesi',
  'Ordu Üniversitesi',
  'Orta Doğu Teknik Üniversitesi',
  'Osmaniye Korkut Ata Üniversitesi',
  'OSTİM Teknik Üniversitesi',
  'Özyeğin Üniversitesi',
  'Pamukkale Üniversitesi',
  'Piri Reis Üniversitesi',
  'Recep Tayyip Erdoğan Üniversitesi',
  'Sabancı Üniversitesi',
  'Sağlık Bilimleri Üniversitesi',
  'Sakarya Uygulamalı Bilimler Üniversitesi',
  'Sakarya Üniversitesi',
  'Samsun Üniversitesi',
  'Selçuk Üniversitesi',
  'Siirt Üniversitesi',
  'Sinop Üniversitesi',
  'Sivas Bilim Ve Teknoloji Üniversitesi',
  'Sivas Cumhuriyet Üniversitesi',
  'Süleyman Demirel Üniversitesi',
  'Şırnak Üniversitesi',
  'Tarsus Üniversitesi',
  'TED Üniversitesi',
  'Tekirdağ Namık Kemal Üniversitesi',
  'TOBB Ekonomi ve Teknoloji Üniversitesi',
  'Tokat Gaziosmanpaşa Üniversitesi',
  'Toros Üniversitesi',
  'Trabzon Üniversitesi',
  'Trakya Üniversitesi',
  'Türk-Alman Üniversitesi',
  'Türk Hava Kurumu Üniversitesi',
  'Türk-Japon Bilim ve Teknoloji Üniversitesi',
  'Ufuk Üniversitesi',
  'Uşak Üniversitesi',
  'Üsküdar Üniversitesi',
  'Van Yüzüncü Yıl Üniversitesi',
  'Yalova Üniversitesi',
  'Yaşar Üniversitesi',
  'Yeditepe Üniversitesi',
  'Yıldız Teknik Üniversitesi',
  'Yozgat Bozok Üniversitesi',
  'Yüksek İhtisas Üniversitesi',
  'Zonguldak Bülent Ecevit Üniversitesi',
];

function normalizeTr(value: string) {
  return value.toLocaleLowerCase('tr-TR');
}

export default function RegisterProfileScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const incoming = route?.params?.data ?? {};

  const [fullName, setFullName] = useState(incoming.fullName ?? '');
  const [institution, setInstitution] = useState(incoming.institution ?? '');
  const [department, setDepartment] = useState(incoming.department ?? '');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [universityDropdownOpen, setUniversityDropdownOpen] = useState(false);
  const [universityQuery, setUniversityQuery] = useState('');

  const filteredUniversities = useMemo(() => {
    const query = normalizeTr(universityQuery.trim());
    if (!query) return TURKISH_UNIVERSITIES;
    return TURKISH_UNIVERSITIES.filter(name =>
      normalizeTr(name).includes(query),
    );
  }, [universityQuery]);

  const canContinue =
    fullName.trim().length > 0 &&
    institution.trim().length > 0 &&
    department.length > 0;

  function handleContinue() {
    if (!canContinue) return;
    navigation.navigate('RegisterTraits', {
      data: {
        ...incoming,
        fullName: fullName.trim(),
        institution: institution.trim(),
        department,
      },
    });
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* Step header + progress */}
            <View style={styles.stepHeader}>
              <Text style={styles.stepLabel}>STEP 2 OF 4</Text>
              <Text style={styles.stepSection}>Profile Setup</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '50%' }]} />
            </View>

            {/* Hero */}
            <View style={styles.heroIconWrap}>
              <Ionicons
                name="school-outline"
                size={40}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.heroTitle}>Academic Profile</Text>
            <Text style={styles.heroDesc}>
              Define your academic identity to match with elite study sessions.
            </Text>

            {/* ── Full Legal Name ── */}
            <Text style={styles.fieldLabel}>FULL LEGAL NAME</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name="person-outline"
                size={18}
                color={Colors.primary}
              />
              <TextInput
                style={styles.input}
                placeholder="Jane Doe"
                placeholderTextColor={Colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
                autoCorrect={false}
              />
            </View>

            {/* ── Institution ── */}
            <Text style={styles.fieldLabel}>INSTITUTION / UNIVERSITY</Text>
            <TouchableOpacity
              style={styles.inputRow}
              activeOpacity={0.75}
              onPress={() => {
                setUniversityQuery('');
                setUniversityDropdownOpen(open => !open);
              }}
            >
              <Ionicons
                name="business-outline"
                size={18}
                color={Colors.primary}
              />
              <Text
                style={[
                  styles.dropdownValue,
                  !institution && styles.dropdownPlaceholder,
                ]}
                numberOfLines={1}
              >
                {institution || 'Select your university'}
              </Text>
              <Ionicons
                name={universityDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            <Modal
              visible={universityDropdownOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setUniversityDropdownOpen(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setUniversityDropdownOpen(false)}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  style={styles.universitySheet}
                  onPress={() => {}}
                >
                  <View style={styles.universitySearchRow}>
                    <Ionicons
                      name="search-outline"
                      size={16}
                      color={Colors.textMuted}
                    />
                    <TextInput
                      style={styles.universitySearchInput}
                      placeholder="Search universities"
                      placeholderTextColor={Colors.textMuted}
                      value={universityQuery}
                      onChangeText={setUniversityQuery}
                      autoCorrect={false}
                      autoFocus
                    />
                    <TouchableOpacity
                      onPress={() => setUniversityDropdownOpen(false)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="close"
                        size={20}
                        color={Colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={filteredUniversities}
                    keyExtractor={item => item}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                      <Text style={styles.universityEmpty}>
                        No universities found
                      </Text>
                    }
                    renderItem={({ item, index }) => {
                      const selected = item === institution;
                      return (
                        <TouchableOpacity
                          style={[
                            styles.dropdownItem,
                            index < filteredUniversities.length - 1 &&
                              styles.dropdownItemBorder,
                          ]}
                          activeOpacity={0.7}
                          onPress={() => {
                            setInstitution(item);
                            setUniversityDropdownOpen(false);
                            setUniversityQuery('');
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              selected && styles.dropdownItemTextSel,
                            ]}
                            numberOfLines={1}
                          >
                            {item}
                          </Text>
                          {selected && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color={Colors.primary}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    }}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>

            {/* ── Department dropdown ── */}
            <Text style={styles.fieldLabel}>PRIMARY DEPARTMENT</Text>
            <TouchableOpacity
              style={styles.inputRow}
              activeOpacity={0.75}
              onPress={() => setDropdownOpen(open => !open)}
            >
              <Ionicons name="flask-outline" size={18} color={Colors.primary} />
              <Text
                style={[
                  styles.dropdownValue,
                  !department && styles.dropdownPlaceholder,
                ]}
              >
                {department || 'Select your department'}
              </Text>
              <Ionicons
                name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={styles.dropdownList}>
                {ALL_DEPARTMENTS.map((dept, idx) => {
                  const selected = dept === department;
                  return (
                    <TouchableOpacity
                      key={dept}
                      style={[
                        styles.dropdownItem,
                        idx < ALL_DEPARTMENTS.length - 1 &&
                          styles.dropdownItemBorder,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setDepartment(dept);
                        setDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selected && styles.dropdownItemTextSel,
                        ]}
                      >
                        {dept}
                      </Text>
                      {selected && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={Colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Continue */}
            <TouchableOpacity
              style={[
                styles.continueBtn,
                !canContinue && styles.continueBtnDisabled,
              ]}
              activeOpacity={canContinue ? 0.85 : 1}
              onPress={handleContinue}
              disabled={!canContinue}
            >
              <Text style={styles.continueBtnText}>
                Continue to Specialization
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={Colors.textOnYellow}
              />
            </TouchableOpacity>

            {/* Back link */}
            <TouchableOpacity
              style={styles.backLink}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="arrow-back"
                size={16}
                color={Colors.textPrimary}
              />
              <Text style={styles.backLinkText}>Back to Account Setup</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  scrollContent: {
    padding: Spacing.base,
    paddingTop: 56,
    paddingBottom: Spacing.xl,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
  },

  // Step header + progress
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  stepLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  stepSection: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceMid,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },

  // Hero
  heroIconWrap: {
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.black,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroDesc: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },

  // Fields
  fieldLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceMid,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  dropdownValue: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  dropdownPlaceholder: {
    color: Colors.textMuted,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceMid,
    marginTop: -Spacing.md,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dropdownItemText: {
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
  },
  dropdownItemTextSel: {
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  universitySheet: {
    maxHeight: '75%',
    backgroundColor: Colors.surfaceMid,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  universitySearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
  },
  universitySearchInput: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  universityEmpty: {
    fontSize: Typography.size.base,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.lg,
  },

  // Continue
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
    marginBottom: Spacing.lg,
  },
  continueBtnDisabled: {
    opacity: 0.45,
  },
  continueBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textOnYellow,
  },

  // Back link
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  backLinkText: {
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    fontWeight: Typography.weight.medium,
  },
});
