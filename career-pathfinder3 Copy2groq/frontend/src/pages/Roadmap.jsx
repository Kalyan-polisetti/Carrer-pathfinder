import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import client from '../api/client'
import { colors, fonts, page, btnPrimary } from '../styles/theme'

export default function Roadmap() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const career = params.get('career')

  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!career) {
      setError('No career was selected.')
      setLoading(false)
      return
    }

    loadRoadmap()
  }, [career])

  async function loadRoadmap() {
    try {
      setLoading(true)
      setError('')

      const response = await client.get(
        `/api/roadmap?career=${encodeURIComponent(career)}`
      )

      setRoadmap(response.data)
    } catch (err) {
      console.error('Roadmap error:', err)

      const detail = err?.response?.data?.detail

      if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => item?.msg)
            .filter(Boolean)
            .join(', ') || 'Invalid roadmap request.'
        )
      } else if (typeof detail === 'string') {
        setError(detail)
      } else {
        setError(
          err?.message ||
            'Could not load the career roadmap.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={page}>
      <Header
        title="Career Roadmap"
        onBack={() => navigate('/dashboard')}
      />

      <main
        style={{
          maxWidth: 1050,
          margin: '0 auto',
          padding: '44px 24px 80px',
        }}
      >
        <div style={{ marginBottom: 34 }}>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              color: colors.teal,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Your learning path
          </div>

          <h1
            style={{
              fontFamily: fonts.serif,
              fontSize: 40,
              margin: '8px 0',
            }}
          >
            {career}
          </h1>

          <p
            style={{
              color: colors.muted,
              maxWidth: 720,
              lineHeight: 1.7,
            }}
          >
            Follow this roadmap progressively from fundamentals
            to practical projects and job readiness.
          </p>
        </div>

        {loading && (
          <div style={infoBox}>
            Loading your career roadmap...
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              ...infoBox,
              borderColor: colors.coral,
              color: colors.coral,
            }}
          >
            <strong>Unable to load roadmap</strong>

            <p style={{ lineHeight: 1.6 }}>
              {error}
            </p>

            <button
              onClick={loadRoadmap}
              style={btnPrimary}
            >
              Try again →
            </button>
          </div>
        )}

        {!loading && !error && roadmap && (
          <RoadmapContent roadmap={roadmap} />
        )}
      </main>
    </div>
  )
}

function RoadmapContent({ roadmap }) {
  /*
   * Supports common JSON structures:
   *
   * {
   *   career: "...",
   *   stages: [...]
   * }
   *
   * or
   *
   * {
   *   career: "...",
   *   roadmap: [...]
   * }
   */

  const stages =
    roadmap.stages ||
    roadmap.roadmap ||
    roadmap.steps ||
    roadmap.phases ||
    []

  if (!Array.isArray(stages) || stages.length === 0) {
    return (
      <div style={infoBox}>
        <strong>
          Roadmap data was found, but no learning stages
          are available yet.
        </strong>

        <p style={{ color: colors.muted }}>
          Add roadmap stages for this career to your
          <code>roadmaps.json</code>.
        </p>
      </div>
    )
  }

  return (
    <div>
      {stages.map((stage, index) => (
        <RoadmapStage
          key={index}
          stage={stage}
          index={index}
        />
      ))}
    </div>
  )
}

function RoadmapStage({ stage, index }) {
  const title =
    stage.title ||
    stage.name ||
    stage.phase ||
    `Stage ${index + 1}`

  const description =
    stage.description ||
    stage.goal ||
    stage.summary ||
    ''

  const skills =
    stage.skills ||
    stage.topics ||
    stage.learn ||
    []

  const projects =
    stage.projects ||
    stage.project_ideas ||
    []

  const resources =
    stage.resources ||
    stage.courses ||
    []

  return (
    <section
      style={{
        position: 'relative',
        marginBottom: 20,
        paddingLeft: 54,
      }}
    >
      {/* NUMBER */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: `1px solid ${colors.amber}`,
          color: colors.amber,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: fonts.mono,
          fontSize: 12,
        }}
      >
        {index + 1}
      </div>

      {/* CONNECTOR */}
      <div
        style={{
          position: 'absolute',
          left: 17,
          top: 36,
          bottom: -20,
          width: 1,
          background: colors.line,
        }}
      />

      <div
        style={{
          background: colors.panel,
          border: `1px solid ${colors.line}`,
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 10,
            color: colors.teal,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Stage {index + 1}
        </div>

        <h2
          style={{
            fontFamily: fonts.serif,
            fontSize: 25,
            margin: '8px 0',
          }}
        >
          {title}
        </h2>

        {description && (
          <p
            style={{
              color: colors.muted,
              lineHeight: 1.7,
              marginTop: 0,
            }}
          >
            {description}
          </p>
        )}

        {skills.length > 0 && (
          <RoadmapList
            title="Learn"
            items={skills}
          />
        )}

        {projects.length > 0 && (
          <RoadmapList
            title="Practice / Projects"
            items={projects}
          />
        )}

        {resources.length > 0 && (
          <RoadmapList
            title="Resources"
            items={resources}
          />
        )}
      </div>
    </section>
  )
}

function RoadmapList({ title, items }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 10,
          color: colors.muted,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 9,
        }}
      >
        {title}
      </div>

      <ul
        style={{
          margin: 0,
          paddingLeft: 20,
          color: colors.paper,
          lineHeight: 1.8,
        }}
      >
        {items.map((item, index) => {
          if (typeof item === 'string') {
            return <li key={index}>{item}</li>
          }

          return (
            <li key={index}>
              {item.title ||
                item.name ||
                item.skill ||
                item.topic ||
                JSON.stringify(item)}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

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

const secondaryButton = {
  background: 'transparent',
  border: `1px solid ${colors.line}`,
  color: colors.paper,
  borderRadius: 8,
  padding: '9px 14px',
  cursor: 'pointer',
}

const infoBox = {
  background: colors.panel,
  border: `1px solid ${colors.line}`,
  borderRadius: 14,
  padding: 22,
  color: colors.muted,
}