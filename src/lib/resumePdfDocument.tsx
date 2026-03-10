import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import {
  resumeData,
  formatDateRange,
  getYearsOfExperience,
} from "@/data/resume";

// Using built-in Helvetica and Courier fonts (always available, no network needed)

// ─── Colors ──────────────────────────────────────────────────────────────────

const MATRIX_GREEN = "#00814a";
const DARK_GREEN = "#004d2e";
const TEXT_PRIMARY = "#1a1a1a";
const TEXT_SECONDARY = "#4a4a4a";
const TEXT_MUTED = "#6b6b6b";
const BORDER_GREEN = "#00cc6a";
const BG_GREEN_LIGHT = "#f0fdf4";

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: TEXT_PRIMARY,
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 36,
    backgroundColor: "#ffffff",
  },
  // Header
  header: {
    marginBottom: 16,
    borderBottom: `2px solid ${BORDER_GREEN}`,
    paddingBottom: 12,
  },
  name: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: DARK_GREEN,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  jobTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: MATRIX_GREEN,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  contactItem: {
    fontSize: 8,
    color: TEXT_SECONDARY,
  },
  contactLink: {
    fontSize: 8,
    color: MATRIX_GREEN,
    textDecoration: "none",
  },
  // Sections
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Courier-Bold",
    fontSize: 10,
    color: DARK_GREEN,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: `1px solid ${BORDER_GREEN}`,
  },
  // Profile
  profileText: {
    fontSize: 9,
    color: TEXT_SECONDARY,
    lineHeight: 1.5,
  },
  // Core Strengths
  strengthRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  strengthLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: TEXT_PRIMARY,
    width: 130,
  },
  strengthDesc: {
    fontSize: 8.5,
    color: TEXT_SECONDARY,
    flex: 1,
    lineHeight: 1.4,
  },
  // Experience
  expEntry: {
    marginBottom: 8,
  },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  expCompany: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: TEXT_PRIMARY,
  },
  expTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: MATRIX_GREEN,
  },
  expDate: {
    fontFamily: "Courier",
    fontSize: 8,
    color: TEXT_MUTED,
    textAlign: "right" as const,
  },
  expLocation: {
    fontSize: 7.5,
    color: TEXT_MUTED,
    marginBottom: 3,
  },
  expOverview: {
    fontSize: 8,
    color: TEXT_SECONDARY,
    // no italic font registered, use lighter color instead
    marginBottom: 3,
    lineHeight: 1.4,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 1.5,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 8,
    color: MATRIX_GREEN,
    width: 10,
    marginTop: 0.5,
  },
  bulletText: {
    fontSize: 8.5,
    color: TEXT_SECONDARY,
    flex: 1,
    lineHeight: 1.4,
  },
  techRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    marginTop: 2,
    paddingLeft: 4,
  },
  techTag: {
    fontSize: 7,
    color: MATRIX_GREEN,
    backgroundColor: BG_GREEN_LIGHT,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 2,
  },
  // Skills
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillTag: {
    fontSize: 8,
    color: DARK_GREEN,
    backgroundColor: BG_GREEN_LIGHT,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    border: `0.5px solid ${BORDER_GREEN}`,
  },
  // Languages
  langRow: {
    flexDirection: "row",
    gap: 16,
  },
  langItem: {
    fontSize: 8.5,
    color: TEXT_SECONDARY,
  },
  langLevel: {
    fontFamily: "Helvetica-Bold",
    color: TEXT_PRIMARY,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 16,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTop: `0.5px solid #e0e0e0`,
  },
  footerText: {
    fontFamily: "Courier",
    fontSize: 6.5,
    color: TEXT_MUTED,
  },
  footerLink: {
    fontFamily: "Courier",
    fontSize: 6.5,
    color: MATRIX_GREEN,
    textDecoration: "none",
  },
});

// ─── Document ────────────────────────────────────────────────────────────────

export default function ResumePdfDocument() {
  const d = resumeData;
  const yearsExp = getYearsOfExperience();

  return (
    <Document
      title={`${d.personal.fullName} — Resume`}
      author={d.personal.fullName}
      subject="Senior Full-Stack Engineer Resume"
      keywords="Ruby on Rails, React, AWS, Full-Stack, Senior Engineer"
    >
      <Page size="LETTER" style={s.page}>
        {/* ── Header ── */}
        <View style={s.header}>
          <Text style={s.name}>{d.personal.fullName}</Text>
          <View style={s.titleRow}>
            <Text style={s.jobTitle}>
              {d.personal.title} · {yearsExp}+ Years
            </Text>
          </View>
          <View style={s.contactRow}>
            <Link src={`mailto:${d.personal.email}`} style={s.contactLink}>
              {d.personal.email}
            </Link>
            <Text style={s.contactItem}>·</Text>
            <Link src={d.personal.website} style={s.contactLink}>
              dan1d.dev
            </Link>
            <Text style={s.contactItem}>·</Text>
            <Link src={d.personal.github} style={s.contactLink}>
              github.com/dan1d
            </Link>
            <Text style={s.contactItem}>·</Text>
            <Link src={d.personal.linkedin} style={s.contactLink}>
              linkedin.com/in/dan1d
            </Link>
            <Text style={s.contactItem}>·</Text>
            <Text style={s.contactItem}>{d.personal.location}</Text>
          </View>
        </View>

        {/* ── Profile ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>// Profile</Text>
          <Text style={s.profileText}>{d.profile}</Text>
        </View>

        {/* ── Core Strengths ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>// Core Strengths</Text>
          {d.coreStrengths.map((cs) => (
            <View key={cs.area} style={s.strengthRow}>
              <Text style={s.strengthLabel}>{cs.area}:</Text>
              <Text style={s.strengthDesc}>{cs.description}</Text>
            </View>
          ))}
        </View>

        {/* ── Experience (page 1: first 3 roles) ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>// Experience</Text>
          {d.experience.slice(0, 3).map((exp) => (
            <ExperienceEntry key={`${exp.company}-${exp.startDate}`} exp={exp} />
          ))}
        </View>

        {/* Footer */}
        <PageFooter />
      </Page>

      {/* ── Page 2: More experience ── */}
      <Page size="LETTER" style={s.page}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>// Experience (continued)</Text>
          {d.experience.slice(3, 7).map((exp) => (
            <ExperienceEntry key={`${exp.company}-${exp.startDate}`} exp={exp} />
          ))}
        </View>

        <PageFooter />
      </Page>

      {/* ── Page 3: Remaining experience + Skills + Volunteering ── */}
      <Page size="LETTER" style={s.page}>
        {d.experience.length > 7 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>// Experience (continued)</Text>
            {d.experience.slice(7).map((exp) => (
              <ExperienceEntry
                key={`${exp.company}-${exp.startDate}`}
                exp={exp}
              />
            ))}
          </View>
        )}

        {/* ── Skills ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>// Technical Skills</Text>
          <View style={s.skillsGrid}>
            {d.skills.map((skill) => (
              <Text key={skill} style={s.skillTag}>
                {skill}
              </Text>
            ))}
          </View>
        </View>

        {/* ── Volunteering ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>// Open Source & Volunteering</Text>
          {d.volunteering.map((vol) => (
            <View key={vol.organization} style={s.expEntry}>
              <View style={s.expHeader}>
                <View>
                  <Text style={s.expCompany}>{vol.organization}</Text>
                  <Text style={s.expTitle}>{vol.role}</Text>
                </View>
                <Text style={s.expDate}>
                  {formatDateRange(vol.startDate, vol.endDate)}
                </Text>
              </View>
              <Text style={s.expLocation}>{vol.location}</Text>
              <Text style={s.expOverview}>{vol.description}</Text>
              {vol.highlights.map((h, i) => (
                <View key={i} style={s.bullet}>
                  <Text style={s.bulletDot}>▸</Text>
                  <Text style={s.bulletText}>{h}</Text>
                </View>
              ))}
              {vol.technologies && (
                <View style={s.techRow}>
                  {vol.technologies.map((t) => (
                    <Text key={t} style={s.techTag}>
                      {t}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* ── Languages ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>// Languages</Text>
          <View style={s.langRow}>
            {d.languages.map((l) => (
              <Text key={l.language} style={s.langItem}>
                <Text style={s.langLevel}>{l.language}</Text> — {l.level}
              </Text>
            ))}
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ExperienceEntry({ exp }: { exp: (typeof resumeData.experience)[0] }) {
  return (
    <View style={s.expEntry} wrap={false}>
      <View style={s.expHeader}>
        <View>
          <Text style={s.expCompany}>{exp.company}</Text>
          <Text style={s.expTitle}>{exp.title}</Text>
        </View>
        <View>
          <Text style={s.expDate}>
            {formatDateRange(exp.startDate, exp.endDate)}
          </Text>
          <Text style={s.expLocation}>{exp.location}</Text>
        </View>
      </View>
      {exp.companyOverview && (
        <Text style={s.expOverview}>{exp.companyOverview}</Text>
      )}
      {exp.highlights.slice(0, 5).map((h, i) => (
        <View key={i} style={s.bullet}>
          <Text style={s.bulletDot}>▸</Text>
          <Text style={s.bulletText}>{h}</Text>
        </View>
      ))}
      {exp.technologies && (
        <View style={s.techRow}>
          {exp.technologies.slice(0, 8).map((t) => (
            <Text key={t} style={s.techTag}>
              {t}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function PageFooter() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>
        Generated from dan1d.dev · {new Date().toISOString().split("T")[0]}
      </Text>
      <Link src="https://dan1d.dev" style={s.footerLink}>
        https://dan1d.dev
      </Link>
    </View>
  );
}
