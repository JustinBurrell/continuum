import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

// Image assets - placed in mobile/assets/images/
// Note: Calendar is rendered as a styled View since SVG isn't supported natively
const womanImg = require('../assets/images/woman-student.png');
const indexCardImg = require('../assets/images/index-card.png');
const briefcaseImg = require('../assets/images/briefcase.png');
const googleDocsImg = require('../assets/images/google-docs-logo.png');
const allStarCodeLogo = require('../assets/images/allstarcode-logo.png');
const googlePlayLogo = require('../assets/images/google-play-logo.png');

export default function Landing({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navbar */}
        <Navbar navigation={navigation} />

        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Hero Text */}
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>
              The seamless transition{'\n'}from classroom to career
            </Text>
            <Text style={styles.heroSubtitle}>
              Unify your notes, studying, tasks, and career prep in one platform. No app switching, just seamless progress.
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation?.navigate('Register')}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaButtonText}>Get Started Today</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Image */}
          <HeroImage />
        </View>

        {/* Featured Section */}
        <View style={styles.featuredSection}>
          <Text style={styles.featuredText}>
            Featured in 2026 Technical Entrepreneurship Incubator
          </Text>
          <View style={styles.logoContainer}>
            <Image source={allStarCodeLogo} style={styles.partnerLogo} resizeMode="contain" />
            <Image source={googlePlayLogo} style={styles.partnerLogoSmall} resizeMode="contain" />
          </View>
        </View>

        {/* Features Headline */}
        <View style={styles.featuresHeadline}>
          <View style={styles.featuresBadge}>
            <Text style={styles.featuresBadgeText}>Features</Text>
          </View>
          <Text style={styles.featuresDescription}>
            Our features allow you to import notes from Google Docs, generate AI-powered flashcards, manage tasks with integrated calendars, collaborate with friends, and track your entire career journey.
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          <FeatureCard
            title="Smart Notes"
            description="Import your Google Docs instantly and transform them into organized, searchable notes with AI-powered summaries and highlights."
          />
          <FeatureCard
            title="Flashcards"
            description="Generate study-ready flashcards automatically from any note. Study with an interactive flip interface designed for retention."
          />
          <FeatureCard
            title="Unified Calendar"
            description="Manage tasks, deadlines, and group projects in one view. Create shared tasks that sync across your study group's calendars."
          />
          <FeatureCard
            title="Social Learning"
            description="Share notes and flashcards with friends, collaborate on assignments, and stay connected through integrated messaging."
          />
          <FeatureCard
            title="Career Hub"
            description="Upload resumes for AI-powered feedback, track applications with networking logs, and manage your entire job search pipeline."
          />
          <FeatureCard
            title="Offline Ready"
            description="Study, take notes, and manage tasks without internet. Everything syncs automatically when you reconnect."
          />
        </View>

        {/* Footer */}
        <Footer />
      </ScrollView>
    </View>
  );
}

// Navbar Component
function Navbar({ navigation }) {
  return (
    <View style={styles.navbar}>
      <Text style={styles.navLogo}>Continuum</Text>
      <View style={styles.navButtons}>
        <TouchableOpacity
          style={styles.navButtonOutline}
          onPress={() => navigation?.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text style={styles.navButtonOutlineText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButtonFilled}
          onPress={() => navigation?.navigate('Register')}
          activeOpacity={0.8}
        >
          <Text style={styles.navButtonFilledText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Hero Image Component
function HeroImage() {
  return (
    <View style={styles.heroImageContainer}>
      {/* Jane Doe Card */}
      <View style={styles.janeDoeCard}>
        <Text style={styles.janeDoeTitle}>Jane Doe</Text>
        <Text style={styles.janeDoeSubtitle}>Sophomore at Lehigh University</Text>
        <Text style={styles.janeDoeSubtitle}>Business Information Systems Major</Text>
      </View>

      {/* Woman Student */}
      <Image source={womanImg} style={styles.womanImage} resizeMode="contain" />

      {/* Calendar - Styled placeholder since original is SVG */}
      <CalendarPlaceholder />

      {/* Briefcase */}
      <Image source={briefcaseImg} style={styles.briefcaseImage} resizeMode="contain" />

      {/* Google Docs */}
      <Image source={googleDocsImg} style={styles.googleDocsImage} resizeMode="contain" />

      {/* Index Card / Flashcard */}
      <Image source={indexCardImg} style={styles.indexCardImage} resizeMode="contain" />
    </View>
  );
}

// Calendar Placeholder Component (replaces SVG)
function CalendarPlaceholder() {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dates = [
    [null, null, null, null, 1, 2, 3],
    [4, 5, 6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15, 16, 17],
    [18, 19, 20, 21, 22, 23, 24],
    [25, 26, 27, 28, 29, 30, null],
  ];

  return (
    <View style={styles.calendarPlaceholder}>
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarMonth}>November 2026</Text>
      </View>
      {/* Day Headers */}
      <View style={styles.calendarDaysRow}>
        {days.map((day, i) => (
          <Text key={i} style={styles.calendarDayHeader}>{day}</Text>
        ))}
      </View>
      {/* Date Grid */}
      {dates.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.calendarWeekRow}>
          {week.map((date, dayIndex) => (
            <View
              key={dayIndex}
              style={[
                styles.calendarDateCell,
                date === 15 && styles.calendarDateHighlight,
              ]}
            >
              <Text
                style={[
                  styles.calendarDateText,
                  date === 15 && styles.calendarDateTextHighlight,
                ]}
              >
                {date || ''}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// Feature Card Component
function FeatureCard({ title, description }) {
  return (
    <TouchableOpacity style={styles.featureCard} activeOpacity={0.9}>
      <Text style={styles.featureCardTitle}>{title}</Text>
      <Text style={styles.featureCardDescription}>{description}</Text>
    </TouchableOpacity>
  );
}

// Footer Component
function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerLogo}>Continuum</Text>
      <View style={styles.footerLinks}>
        <TouchableOpacity>
          <Text style={styles.footerLink}>Product</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.footerLink}>Features</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.footerLink}>Contact</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.footerCopyright}>
        2026 Continuum. All rights reserved.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 24,
  },

  // Navbar
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 24,
  },
  navLogo: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '600',
    color: '#6b21a8',
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navButtonOutline: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6b21a8',
  },
  navButtonOutlineText: {
    color: '#6b21a8',
    fontWeight: '600',
    fontSize: 14,
  },
  navButtonFilled: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#6b21a8',
  },
  navButtonFilledText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroTextContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroTitle: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  heroSubtitle: {
    fontFamily: 'System',
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  ctaButton: {
    backgroundColor: '#6b21a8',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    opacity: 0.9,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },

  // Hero Image
  heroImageContainer: {
    width: width - 64,
    height: 260,
    position: 'relative',
  },
  janeDoeCard: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EDE9FE',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 180,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  janeDoeTitle: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '500',
    color: '#6b21a8',
    marginBottom: 2,
  },
  janeDoeSubtitle: {
    fontFamily: 'System',
    fontSize: 11,
    color: '#6b21a8',
  },
  womanImage: {
    position: 'absolute',
    top: 8,
    left: 0,
    width: 70,
    height: 70,
    zIndex: 20,
  },
  // Calendar Placeholder Styles
  calendarPlaceholder: {
    position: 'absolute',
    top: 60,
    left: 32,
    width: 190,
    height: 170,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarHeader: {
    marginBottom: 6,
  },
  calendarMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b21a8',
    textAlign: 'center',
  },
  calendarDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  calendarDayHeader: {
    fontSize: 8,
    fontWeight: '500',
    color: '#9ca3af',
    width: 22,
    textAlign: 'center',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 2,
  },
  calendarDateCell: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  calendarDateHighlight: {
    backgroundColor: '#6b21a8',
  },
  calendarDateText: {
    fontSize: 9,
    color: '#374151',
  },
  calendarDateTextHighlight: {
    color: '#ffffff',
    fontWeight: '600',
  },
  briefcaseImage: {
    position: 'absolute',
    top: 110,
    right: 50,
    width: 40,
    height: 40,
    zIndex: 10,
  },
  googleDocsImage: {
    position: 'absolute',
    bottom: 8,
    left: 80,
    width: 36,
    height: 50,
    zIndex: 10,
  },
  indexCardImage: {
    position: 'absolute',
    bottom: 24,
    right: 40,
    width: 80,
    height: 60,
    zIndex: 10,
  },

  // Featured Section
  featuredSection: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 24,
  },
  featuredText: {
    fontFamily: 'System',
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  partnerLogo: {
    height: 40,
    width: 80,
  },
  partnerLogoSmall: {
    height: 32,
    width: 70,
  },

  // Features Headline
  featuresHeadline: {
    marginBottom: 24,
  },
  featuresBadge: {
    backgroundColor: '#6b21a8',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignSelf: 'center',
    marginBottom: 16,
    shadowColor: '#6b21a8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  featuresBadgeText: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  featuresDescription: {
    fontFamily: 'System',
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },

  // Features Grid
  featuresGrid: {
    gap: 16,
    marginBottom: 32,
  },
  featureCard: {
    backgroundColor: '#ede9fe',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureCardTitle: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  featureCardDescription: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#000000',
    lineHeight: 20,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerLogo: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '600',
    color: '#6b21a8',
    marginBottom: 16,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  footerLink: {
    fontFamily: 'System',
    fontSize: 14,
    color: '#6b7280',
  },
  footerCopyright: {
    fontFamily: 'System',
    fontSize: 12,
    color: '#9ca3af',
  },
});
