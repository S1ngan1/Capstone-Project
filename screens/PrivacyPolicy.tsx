import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import BottomNavigation from '../components/BottomNavigation'

const { width } = Dimensions.get('window')
const isSmallDevice = width < 350

const PrivacyPolicy = () => {
  const navigation = useNavigation()

  const privacySections = [
    {
      title: 'Information We Collect',
      content: [
        'Account information (username, email, phone number)',
        'Farm data (location, sensors, weather information)',
        'Usage data (app interactions, preferences)',
        'Device information (device type, operating system)',
      ],
    },
    {
      title: 'How We Use Your Information',
      content: [
        'Provide and improve our farming assistance services',
        'Generate personalized AI recommendations',
        'Send notifications about your farms and sensors',
        'Analyze usage patterns to enhance user experience',
      ],
    },
    {
      title: 'Data Sharing and Disclosure',
      content: [
        'We do not sell your personal information to third parties',
        'Weather data is sourced from third-party weather services',
        'Anonymous usage statistics may be shared for research',
        'Legal compliance when required by law',
      ],
    },
    {
      title: 'Data Security',
      content: [
        'Industry-standard encryption for data transmission',
        'Secure cloud storage with regular backups',
        'Access controls and authentication measures',
        'Regular security audits and updates',
      ],
    },
    {
      title: 'Your Rights',
      content: [
        'Access and review your personal data',
        'Request correction of inaccurate information',
        'Delete your account and associated data',
        'Export your data in a portable format',
      ],
    },
    {
      title: 'Data Retention',
      content: [
        'Active accounts: Data retained while account is active',
        'Inactive accounts: Data may be deleted after 2 years of inactivity',
        'Deleted accounts: Most data removed within 30 days',
        'Legal requirements: Some data retained as required by law',
      ],
    },
  ]

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={['#4CAF50', '#45A049']} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* Introduction */}
          <View style={styles.section}>
            <Text style={styles.title}>Privacy Policy</Text>
            <Text style={styles.lastUpdated}>Last updated: December 2024</Text>

            <Text style={styles.introText}>
              At Smart Farm Assistant, we are committed to protecting your privacy and ensuring
              the security of your personal information. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you use our mobile
              application.
            </Text>

            <Text style={styles.introText}>
              By using Smart Farm Assistant, you agree to the collection and use of information
              in accordance with this policy.
            </Text>
          </View>

          {/* Privacy Sections */}
          {privacySections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.content.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.listItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          ))}

          {/* Cookies and Tracking */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cookies and Tracking Technologies</Text>
            <Text style={styles.bodyText}>
              We may use cookies, beacons, tags, and scripts to collect and track information
              and to improve and analyze our service. You can instruct your browser to refuse
              all cookies or to indicate when a cookie is being sent.
            </Text>
          </View>

          {/* Third-Party Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Third-Party Services</Text>
            <Text style={styles.bodyText}>
              Our app may contain links to third-party websites or services that are not
              owned or controlled by Smart Farm Assistant. We have no control over and assume
              no responsibility for the content, privacy policies, or practices of any
              third-party websites or services.
            </Text>
          </View>

          {/* Children's Privacy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Children's Privacy</Text>
            <Text style={styles.bodyText}>
              Our service is not intended for children under the age of 13. We do not knowingly
              collect personally identifiable information from children under 13. If you are a
              parent or guardian and believe your child has provided us with personal information,
              please contact us.
            </Text>
          </View>

          {/* Changes to Privacy Policy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Changes to This Privacy Policy</Text>
            <Text style={styles.bodyText}>
              We may update our Privacy Policy from time to time. We will notify you of any
              changes by posting the new Privacy Policy on this page and updating the "Last
              updated" date. You are advised to review this Privacy Policy periodically for
              any changes.
            </Text>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <Text style={styles.bodyText}>
              If you have any questions about this Privacy Policy, please contact us:
            </Text>
            <View style={styles.contactContainer}>
              <View style={styles.contactItem}>
                <Ionicons name="mail-outline" size={20} color="#4CAF50" />
                <Text style={styles.contactText}>privacy@smartfarmassistant.com</Text>
              </View>
              <View style={styles.contactItem}>
                <Ionicons name="globe-outline" size={20} color="#4CAF50" />
                <Text style={styles.contactText}>www.smartfarmassistant.com/privacy</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomNavigation />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginTop: 9,
    marginRight: 12,
  },
  listText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    flex: 1,
  },
  contactContainer: {
    marginTop: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  bottomSpacer: {
    height: 100,
  },
})

export default PrivacyPolicy
