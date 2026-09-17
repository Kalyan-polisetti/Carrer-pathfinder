import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { colors, fonts, page, btnPrimary } from '../styles/theme'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadRecommendations()
  }, [])

  async function loadRecommendations() {
    try {
      const { data } = await client.get('/api/recommend/history')
      setRecommendations(data || [])
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        'Could not load your career recommendations.'
      )
    } finally {
      setLoading(false)
    }
  }

  const latest = recommendations[0]

  return (
    <div style={page}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 32px',
          borderBottom: `1px solid ${colors.line}`,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: fonts.serif,
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            Career Pathfinder
          </div>

          <div
            style={{
              color: colors.muted,
              fontFamily: fonts.mono,
              fontSize: 11,
              marginTop: 4,
            }}
          >
            YOUR CAREER DASHBOARD
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              color: colors.muted,
              fontFamily: fonts.mono,
              fontSize: 12,
            }}
          >
            {user?.email}
          </span>

          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.line}`,
              color: colors.paper,
              borderRadius: 8,
              padding: '8px 14px',
              cursor: 'pointer',
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <main
        style={{
          maxWidth: 1050,
          margin: '0 auto',
          padding: '48px 24px',
        }}
      >
        {loading && (
          <div style={{ color: colors.muted }}>
            Loading your career profile...
          </div>
        )}

        {error && (
          <div style={{ color: colors.coral }}>
            {error}
          </div>
        )}

        {!loading && !latest && (
          <div
            style={{
              background: colors.panel,
              border: `1px solid ${colors.line}`,
              borderRadius: 16,
              padding: 32,
            }}
          >
            <h2 style={{ fontFamily: fonts.serif }}>
              Start your career assessment
            </h2>

            <p style={{ color: colors.muted, lineHeight: 1.6 }}>
              Tell us about your branch, skills and interests to discover
              career paths that fit your profile.
            </p>

            <button
              onClick={() => navigate('/')}
              style={btnPrimary}
            >
              Start assessment →
            </button>
          </div>
        )}

        {latest && (
          <>
            <div style={{ marginBottom: 36 }}>
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 12,
                  color: colors.teal,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Your strongest career match
              </div>

              <h1
                style={{
                  fontFamily: fonts.serif,
                  fontSize: 42,
                  margin: '8px 0',
                  color: colors.amber,
                }}
              >
                {latest.recommended_career}
              </h1>

              <p
                style={{
                  color: '#C9D3CD',
                  maxWidth: 720,
                  lineHeight: 1.7,
                }}
              >
                {latest.match_reason}
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(230px, 1fr))',
                gap: 16,
                marginBottom: 36,
              }}
            >
              <ActionCard
                title="Career Matches"
                description="See your complete career ranking and suitability scores."
                button="View dashboard"
                onClick={() => navigate('/dashboard')}
              />

              <ActionCard
                title="Skill Gap Analysis"
                description="Find exactly which skills you need to develop for your target role."
                button="Analyze skill gap"
                onClick={() =>
                  navigate(
                    `/skill-gap?career=${encodeURIComponent(
                      latest.recommended_career
                    )}&recommendation=${latest.id}`
                  )
                }
              />

              <ActionCard
                title="Career Roadmap"
                description="Follow a structured learning path from fundamentals to job readiness."
                button="View roadmap"
                onClick={() =>
                  navigate(
                    `/roadmap?career=${encodeURIComponent(
                      latest.recommended_career
                    )}`
                  )
                }
              />

              <ActionCard
                title="Career AI"
                description="Ask personalized questions about your recommended career."
                button="Open chat"
                onClick={() =>
                  navigate(`/chat/${latest.id}`)
                }
              />
            </div>

            <section>
              <h2
                style={{
                  fontFamily: fonts.serif,
                  fontSize: 24,
                  marginBottom: 16,
                }}
              >
                Your career matches
              </h2>

              {latest.job_roles?.map((role, index) => (
                <div
                  key={role.job_role}
                  style={{
                    background: colors.panel,
                    border: `1px solid ${
                      index === 0
                        ? colors.amber
                        : colors.line
                    }`,
                    borderRadius: 12,
                    padding: 18,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          color: colors.muted,
                          fontFamily: fonts.mono,
                          fontSize: 11,
                        }}
                      >
                        #{index + 1}
                      </span>

                      <strong
                        style={{
                          marginLeft: 12,
                          fontFamily: fonts.serif,
                          fontSize: 18,
                        }}
                      >
                        {role.job_role}
                      </strong>
                    </div>

                    <strong
                      style={{
                        color:
                          index === 0
                            ? colors.amber
                            : colors.teal,
                        fontFamily: fonts.mono,
                      }}
                    >
                      {role.matchPercentage}%
                    </strong>
                  </div>

                  <div
                    style={{
                      height: 6,
                      background: colors.line,
                      borderRadius: 99,
                      marginTop: 12,
                    }}
                  >
                    <div
                      style={{
                        width: `${role.matchPercentage}%`,
                        height: '100%',
                        background:
                          index === 0
                            ? colors.amber
                            : colors.teal,
                        borderRadius: 99,
                      }}
                    />
                  </div>

                  <p
                    style={{
                      color: colors.muted,
                      fontSize: 13,
                      lineHeight: 1.5,
                      marginBottom: 0,
                    }}
                  >
                    {role.reason}
                  </p>
                </div>
              ))}
            </section>

            <button
              onClick={() => navigate('/')}
              style={{
                ...btnPrimary,
                marginTop: 28,
              }}
            >
              Take another assessment
            </button>
          </>
        )}
      </main>
    </div>
  )
}

function ActionCard({
  title,
  description,
  button,
  onClick,
}) {
  return (
    <div
      style={{
        background: colors.panel,
        border: `1px solid ${colors.line}`,
        borderRadius: 16,
        padding: 22,
      }}
    >
      <h3
        style={{
          fontFamily: fonts.serif,
          fontSize: 20,
          marginTop: 0,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: colors.muted,
          fontSize: 13,
          lineHeight: 1.6,
          minHeight: 62,
        }}
      >
        {description}
      </p>

      <button
        onClick={onClick}
        style={btnPrimary}
      >
        {button} →
      </button>
    </div>
  )
}