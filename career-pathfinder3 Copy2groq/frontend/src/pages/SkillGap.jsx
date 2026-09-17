import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import client from '../api/client'
import { colors, fonts, page, btnPrimary } from '../styles/theme'

export default function SkillGap() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const career = params.get('career')

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!career) {
      setError('No career was selected.')
      setLoading(false)
      return
    }

    loadSkillGap()
  }, [career])

  async function loadSkillGap() {
    try {
      setLoading(true)
      setError('')

      // Get the latest recommendation/profile.
      const { data: history } =
        await client.get('/api/recommend/history')

      if (!history || !history.length) {
        throw new Error(
          'No career recommendation was found. Please complete an assessment first.'
        )
      }

      const latest = history[0]

      const skills = Array.isArray(latest.skills)
        ? latest.skills
        : []

      /*
       * Backend contract:
       *
       * POST /api/skill-gap?career=Data%20Scientist
       *
       * Body:
       * [
       *   "Python",
       *   "SQL",
       *   "Machine Learning"
       * ]
       */
      const response = await client.post(
        `/api/skill-gap?career=${encodeURIComponent(career)}`,
        skills,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      setData(response.data)
    } catch (err) {
      console.error('Skill gap error:', err)

      const detail = err?.response?.data?.detail

      if (Array.isArray(detail)) {
        const messages = detail
          .map((item) => item?.msg)
          .filter(Boolean)

        setError(
          messages.length
            ? messages.join(', ')
            : 'Invalid skill gap request.'
        )
      } else if (typeof detail === 'string') {
        setError(detail)
      } else if (err?.message) {
        setError(err.message)
      } else {
        setError('Could not load the skill gap analysis.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={page}>
      <Header
        title="Skill Gap Analysis"
        onBack={() => navigate('/dashboard')}
      />

      <main
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '44px 24px 80px',
        }}
      >
        {/* INTRO */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              color: colors.teal,
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Career development
          </div>

          <h1
            style={{
              fontFamily: fonts.serif,
              fontSize: 40,
              margin: 0,
            }}
          >
            Skill Gap Analysis
          </h1>

          <p
            style={{
              color: colors.muted,
              maxWidth: 720,
              lineHeight: 1.7,
            }}
          >
            See how your current skills compare with the skills
            required for{' '}
            <strong style={{ color: colors.paper }}>
              {career}
            </strong>
            .
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div style={infoBox}>
            Analyzing your current skills...
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div
            style={{
              ...infoBox,
              borderColor: colors.coral,
              color: colors.coral,
            }}
          >
            <strong>Unable to load skill gap analysis</strong>

            <p
              style={{
                marginBottom: 18,
                lineHeight: 1.6,
              }}
            >
              {error}
            </p>

            <button
              onClick={loadSkillGap}
              style={btnPrimary}
            >
              Try again →
            </button>
          </div>
        )}

        {/* CONTENT */}
        {!loading && !error && data && (
          <>
            {/* SCORE */}
            <section
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'minmax(220px, 300px) 1fr',
                gap: 18,
                marginBottom: 30,
              }}
            >
              <div
                style={{
                  ...card,
                  textAlign: 'center',
                  padding: 30,
                }}
              >
                <div style={label}>
                  CURRENT SKILL MATCH
                </div>

                <div
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 58,
                    margin: '14px 0',
                    color:
                      data.skill_match_percentage >= 75
                        ? colors.teal
                        : colors.amber,
                  }}
                >
                  {data.skill_match_percentage}%
                </div>

                <div
                  style={{
                    color: colors.muted,
                    fontSize: 13,
                  }}
                >
                  {data.career}
                </div>
              </div>

              <div style={card}>
                <div style={label}>
                  PROFILE SUMMARY
                </div>

                <h2
                  style={{
                    fontFamily: fonts.serif,
                    marginTop: 8,
                  }}
                >
                  Your current position
                </h2>

                <p
                  style={{
                    color: colors.muted,
                    lineHeight: 1.7,
                  }}
                >
                  You currently have{' '}
                  <strong style={{ color: colors.paper }}>
                    {data.skills_you_have?.length || 0}
                  </strong>{' '}
                  of the{' '}
                  <strong style={{ color: colors.paper }}>
                    {data.required_skills?.length || 0}
                  </strong>{' '}
                  skills identified for this career.
                </p>

                <div
                  style={{
                    height: 8,
                    background: colors.line,
                    borderRadius: 99,
                    overflow: 'hidden',
                    marginTop: 20,
                  }}
                >
                  <div
                    style={{
                      width: `${data.skill_match_percentage || 0}%`,
                      height: '100%',
                      background:
                        data.skill_match_percentage >= 75
                          ? colors.teal
                          : colors.amber,
                    }}
                  />
                </div>
              </div>
            </section>

            {/* YOUR SKILLS */}
            <Section title="Skills you already have">
              {data.skills_you_have?.length ? (
                <SkillChips
                  skills={data.skills_you_have}
                  type="good"
                />
              ) : (
                <Empty>
                  No matching skills were identified yet.
                </Empty>
              )}
            </Section>

            {/* MISSING */}
            <Section title="Skills you need to develop">
              {data.missing_skills?.length ? (
                <SkillChips
                  skills={data.missing_skills}
                  type="missing"
                />
              ) : (
                <Empty>
                  Excellent! No required skills are currently
                  missing.
                </Empty>
              )}
            </Section>

            {/* REQUIRED */}
            <Section title="Required skills">
              <SkillChips
                skills={data.required_skills || []}
                type="normal"
              />
            </Section>

            {/* COURSES */}
            <Section title="Recommended courses">
              {data.recommended_courses?.length ? (
                <ResourceGrid
                  items={data.recommended_courses}
                  buttonText="View course →"
                />
              ) : (
                <Empty>
                  No course is currently mapped to your missing
                  skills.
                </Empty>
              )}
            </Section>

            {/* CERTIFICATIONS */}
            <Section title="Recommended certifications">
              {data.recommended_certifications?.length ? (
                <ResourceGrid
                  items={data.recommended_certifications}
                  buttonText="View certification →"
                />
              ) : (
                <Empty>
                  No certification is currently mapped to your
                  missing skills.
                </Empty>
              )}
            </Section>

            {/* NAVIGATION */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                marginTop: 40,
              }}
            >
              <button
                onClick={() => navigate('/dashboard')}
                style={secondaryButton}
              >
                ← Dashboard
              </button>

              <button
                onClick={() =>
                  navigate(
                    `/roadmap?career=${encodeURIComponent(
                      career
                    )}`
                  )
                }
                style={btnPrimary}
              >
                View career roadmap →
              </button>

              <button
                onClick={() => {
                  const recommendationId =
                    params.get('recommendation')

                  if (recommendationId) {
                    navigate(
                      `/chat/${recommendationId}`
                    )
                  } else {
                    navigate('/dashboard')
                  }
                }}
                style={secondaryButton}
              >
                Ask Career AI
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

/* ------------------------------------------------ */
/* Components */
/* ------------------------------------------------ */

function Header({ title, onBack }) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '20px 32px',
        borderBottom: `1px solid ${colors.line}`,
      }}
    >
      <button
        onClick={onBack}
        style={secondaryButton}
      >
        ← Back
      </button>

      <h1
        style={{
          fontFamily: fonts.serif,
          fontSize: 22,
          margin: 0,
        }}
      >
        {title}
      </h1>
    </header>
  )
}

function Section({ title, children }) {
  return (
    <section style={{ marginTop: 32 }}>
      <h2
        style={{
          fontFamily: fonts.serif,
          fontSize: 24,
          marginBottom: 14,
        }}
      >
        {title}
      </h2>

      {children}
    </section>
  )
}

function SkillChips({ skills = [], type }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 9,
      }}
    >
      {skills.map((skill) => {
        let border = colors.line
        let color = colors.paper
        let prefix = ''

        if (type === 'good') {
          border = colors.teal
          color = colors.teal
          prefix = '✓ '
        }

        if (type === 'missing') {
          border = colors.amber
          color = colors.amber
          prefix = '→ '
        }

        return (
          <span
            key={skill}
            style={{
              border: `1px solid ${border}`,
              color,
              borderRadius: 999,
              padding: '8px 13px',
              fontSize: 13,
            }}
          >
            {prefix}
            {skill}
          </span>
        )
      })}
    </div>
  )
}

function ResourceGrid({ items, buttonText }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(270px, 1fr))',
        gap: 16,
      }}
    >
      {items.map((item, index) => (
        <div
          key={`${item.title || 'resource'}-${index}`}
          style={card}
        >
          <div style={label}>
            {item.skill || 'LEARNING RESOURCE'}
          </div>

          <h3
            style={{
              fontFamily: fonts.serif,
              fontSize: 19,
              margin: '8px 0',
            }}
          >
            {item.title}
          </h3>

          <div
            style={{
              color: colors.muted,
              fontSize: 12,
              marginBottom: 8,
            }}
          >
            {item.provider || 'Provider'}
            {item.level
              ? ` · ${item.level}`
              : ''}
          </div>

          {item.description && (
            <p
              style={{
                color: colors.muted,
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {item.description}
            </p>
          )}

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block',
                marginTop: 10,
                color: colors.teal,
                fontFamily: fonts.mono,
                fontSize: 12,
                textDecoration: 'none',
              }}
            >
              {buttonText}
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

function Empty({ children }) {
  return (
    <div
      style={{
        ...card,
        color: colors.muted,
      }}
    >
      {children}
    </div>
  )
}

const card = {
  background: colors.panel,
  border: `1px solid ${colors.line}`,
  borderRadius: 16,
  padding: 24,
}

const infoBox = {
  background: colors.panel,
  border: `1px solid ${colors.line}`,
  borderRadius: 14,
  padding: 22,
  color: colors.muted,
}

const label = {
  fontFamily: fonts.mono,
  fontSize: 10,
  color: colors.muted,
  letterSpacing: 1,
  textTransform: 'uppercase',
}

const secondaryButton = {
  background: 'transparent',
  border: `1px solid ${colors.line}`,
  color: colors.paper,
  borderRadius: 8,
  padding: '9px 14px',
  cursor: 'pointer',
}