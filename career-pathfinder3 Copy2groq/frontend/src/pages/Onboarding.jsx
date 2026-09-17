import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import client from '../api/client'
import { colors, fonts, page, btnPrimary } from '../styles/theme'

const INTERESTS = [
  'AI / Machine Learning',
  'Data Analytics',
  'Web Development',
  'Software Development',
  'Cloud / DevOps',
  'Cybersecurity',
  'Databases',
  'Business Analytics',
]

const SKILLS = {
  'AI / Machine Learning': [
    'Python',
    'Machine Learning',
    'Deep Learning',
    'NLP',
    'Computer Vision',
    'TensorFlow',
    'PyTorch',
  ],

  'Data Analytics': [
    'Python',
    'SQL',
    'Statistics',
    'Excel',
    'Pandas',
    'NumPy',
    'Power BI',
    'Tableau',
    'Data Visualization',
  ],

  'Web Development': [
    'HTML',
    'CSS',
    'JavaScript',
    'React',
    'Node.js',
    'FastAPI',
    'SQL',
    'MongoDB',
    'PostgreSQL',
  ],

  'Software Development': [
    'Python',
    'Java',
    'C++',
    'Data Structures',
    'Algorithms',
    'OOP',
    'Git',
    'SQL',
  ],

  'Cloud / DevOps': [
    'Linux',
    'Git',
    'Cloud Computing',
    'AWS',
    'Azure',
    'Google Cloud',
    'Docker',
    'Kubernetes',
    'Terraform',
    'CI/CD',
  ],

  Cybersecurity: [
    'Networking',
    'Linux',
    'Cybersecurity',
    'Python',
    'Ethical Hacking',
    'Cryptography',
    'SIEM',
  ],

  Databases: [
    'SQL',
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Database Management',
    'Database Security',
  ],

  'Business Analytics': [
    'Excel',
    'SQL',
    'Statistics',
    'Power BI',
    'Tableau',
    'Data Analysis',
    'Data Visualization',
    'Business Strategy',
  ],
}

const PROFICIENCY = [
  {
    value: 'Beginner',
    description: 'I know the basics and can do simple tasks.',
  },
  {
    value: 'Intermediate',
    description: 'I can build projects and solve problems independently.',
  },
  {
    value: 'Advanced',
    description: 'I am confident using this skill in complex projects.',
  },
]

const EXPERIENCE = [
  'Only coursework / learning',
  'Academic projects',
  'Personal projects',
  'Hackathons',
  'Internship experience',
  'Real-world / professional experience',
]

const WORK_PREFERENCES = [
  'Building AI / ML systems',
  'Analyzing data and finding insights',
  'Building web applications',
  'Building backend systems',
  'Working with cloud infrastructure',
  'Cybersecurity and security',
  'Building dashboards and reports',
  'Software engineering',
  'Research and experimentation',
]

const GOALS = [
  'Internship',
  'Placement / full-time job',
  'Higher studies',
  'Explore career options',
  'Build project skills',
  'Switch to a new domain',
]

const TIMELINES = [
  'Within 3 months',
  'Within 6 months',
  'Within 1 year',
  'No specific timeline',
]

export default function Onboarding() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    branch: '',
    graduation_year: '2027',

    interests: [],

    skills: [],
    proficiency: {},

    experience: [],

    work_preferences: [],

    goal: '',
    timeline: '',
  })

  const totalSteps = 7

  function update(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function toggleArray(field, value) {
    setForm((prev) => {
      const current = prev[field] || []

      return {
        ...prev,
        [field]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      }
    })
  }

  const availableSkills = useMemo(() => {
    const result = []

    form.interests.forEach((interest) => {
      ;(SKILLS[interest] || []).forEach((skill) => {
        if (!result.includes(skill)) {
          result.push(skill)
        }
      })
    })

    return result
  }, [form.interests])

  function toggleSkill(skill) {
    setForm((prev) => {
      const exists = prev.skills.includes(skill)

      const skills = exists
        ? prev.skills.filter((item) => item !== skill)
        : [...prev.skills, skill]

      const proficiency = { ...prev.proficiency }

      if (exists) {
        delete proficiency[skill]
      }

      return {
        ...prev,
        skills,
        proficiency,
      }
    })
  }

  function setProficiency(skill, level) {
    setForm((prev) => ({
      ...prev,
      proficiency: {
        ...prev.proficiency,
        [skill]: level,
      },
    }))
  }

  function canContinue() {
    if (step === 1) {
      return form.branch.trim() !== ''
    }

    if (step === 2) {
      return form.interests.length > 0
    }

    if (step === 3) {
      return form.skills.length > 0
    }

    if (step === 4) {
      return form.skills.every(
        (skill) => form.proficiency[skill]
      )
    }

    if (step === 5) {
      return form.experience.length > 0
    }

    if (step === 6) {
      return form.work_preferences.length > 0
    }

    if (step === 7) {
      return form.goal && form.timeline
    }

    return true
  }

  async function next() {
    setError('')

    if (!canContinue()) {
      setError('Please complete this step before continuing.')
      return
    }

    if (step < totalSteps) {
      setStep((value) => value + 1)
      return
    }

    await submitAssessment()
  }

  function back() {
    setError('')

    if (step > 1) {
      setStep((value) => value - 1)
    }
  }

  async function submitAssessment() {
    setLoading(true)

    try {
      /*
       * Keep the original basic fields while also sending
       * the richer assessment information.
       */
      const payload = {
        branch: form.branch,
        graduation_year: Number(form.graduation_year),

        interests: form.interests,

        skills: form.skills,

        skill_proficiency: form.proficiency,

        experience: form.experience,

        work_preferences: form.work_preferences,

        career_goal: form.goal,

        job_ready_timeline: form.timeline,
      }

      await client.post('/api/recommend', payload)

      navigate('/dashboard')
    } catch (err) {
      setError(
        typeof err?.response?.data?.detail === 'string'
          ? err.response.data.detail
          : 'Could not complete your career assessment.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={page}>
      <header
        style={{
          padding: '24px 32px',
          borderBottom: `1px solid ${colors.line}`,
        }}
      >
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 23,
          }}
        >
          Career Pathfinder
        </div>

        <div
          style={{
            color: colors.muted,
            fontFamily: fonts.mono,
            fontSize: 11,
            marginTop: 5,
          }}
        >
          CAREER ASSESSMENT
        </div>
      </header>

      <main
        style={{
          maxWidth: 850,
          margin: '0 auto',
          padding: '42px 24px 60px',
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: colors.muted,
              fontFamily: fonts.mono,
              fontSize: 11,
            }}
          >
            <span>
              STEP {step} OF {totalSteps}
            </span>

            <span>
              {Math.round((step / totalSteps) * 100)}%
            </span>
          </div>

          <div
            style={{
              height: 5,
              background: colors.line,
              borderRadius: 99,
              marginTop: 10,
            }}
          >
            <div
              style={{
                width: `${(step / totalSteps) * 100}%`,
                height: '100%',
                background: colors.teal,
                borderRadius: 99,
                transition: 'width 0.25s ease',
              }}
            />
          </div>
        </div>

        {step === 1 && (
          <Step
            eyebrow="01 · BACKGROUND"
            title="Tell us about your academic background."
            description="This helps us remove careers that don't align with your educational path."
          >
            <FieldLabel>Branch / specialization</FieldLabel>

            <input
              value={form.branch}
              onChange={(e) =>
                update('branch', e.target.value)
              }
              placeholder="e.g. Computer Science / Data Science"
              style={inputStyle}
            />

            <FieldLabel>Graduation year</FieldLabel>

            <select
              value={form.graduation_year}
              onChange={(e) =>
                update('graduation_year', e.target.value)
              }
              style={inputStyle}
            >
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
              <option value="2030">2030</option>
            </select>
          </Step>
        )}

        {step === 2 && (
          <Step
            eyebrow="02 · INTERESTS"
            title="Which areas genuinely interest you?"
            description="Select all areas you would enjoy learning or working in."
          >
            <ChoiceGrid
              items={INTERESTS}
              selected={form.interests}
              onClick={(item) =>
                toggleArray('interests', item)
              }
            />
          </Step>
        )}

        {step === 3 && (
          <Step
            eyebrow="03 · SKILLS"
            title="Which skills have you actually worked with?"
            description="The skills below are selected based on your interests."
          >
            <div
              style={{
                color: colors.teal,
                fontSize: 13,
                marginBottom: 18,
              }}
            >
              {availableSkills.length} relevant skills found
            </div>

            <ChoiceGrid
              items={availableSkills}
              selected={form.skills}
              onClick={toggleSkill}
            />
          </Step>
        )}

        {step === 4 && (
          <Step
            eyebrow="04 · PROFICIENCY"
            title="How strong are you in these skills?"
            description="Be honest. Your proficiency affects your career match."
          >
            {form.skills.map((skill) => (
              <div
                key={skill}
                style={{
                  background: colors.panel,
                  border: `1px solid ${colors.line}`,
                  borderRadius: 14,
                  padding: 18,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 19,
                    marginBottom: 14,
                  }}
                >
                  {skill}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(3, 1fr)',
                    gap: 8,
                  }}
                >
                  {PROFICIENCY.map((level) => (
                    <button
                      key={level.value}
                      onClick={() =>
                        setProficiency(
                          skill,
                          level.value
                        )
                      }
                      style={{
                        ...choiceStyle,
                        borderColor:
                          form.proficiency[skill] ===
                          level.value
                            ? colors.teal
                            : colors.line,
                        color:
                          form.proficiency[skill] ===
                          level.value
                            ? colors.teal
                            : colors.paper,
                      }}
                    >
                      <strong>{level.value}</strong>

                      <small
                        style={{
                          display: 'block',
                          marginTop: 5,
                          color: colors.muted,
                          lineHeight: 1.3,
                        }}
                      >
                        {level.description}
                      </small>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </Step>
        )}

        {step === 5 && (
          <Step
            eyebrow="05 · EXPERIENCE"
            title="Where have you applied your skills?"
            description="Select everything that represents your experience."
          >
            <ChoiceGrid
              items={EXPERIENCE}
              selected={form.experience}
              onClick={(item) =>
                toggleArray('experience', item)
              }
            />
          </Step>
        )}

        {step === 6 && (
          <Step
            eyebrow="06 · WORK STYLE"
            title="What kind of work would you enjoy?"
            description="Choose the types of problems you would like to solve."
          >
            <ChoiceGrid
              items={WORK_PREFERENCES}
              selected={form.work_preferences}
              onClick={(item) =>
                toggleArray(
                  'work_preferences',
                  item
                )
              }
            />
          </Step>
        )}

        {step === 7 && (
          <Step
            eyebrow="07 · CAREER GOAL"
            title="What are you working toward?"
            description="This helps us prioritize careers that match your actual goal."
          >
            <FieldLabel>Primary goal</FieldLabel>

            <ChoiceGrid
              items={GOALS}
              selected={[form.goal]}
              onClick={(item) =>
                update('goal', item)
              }
              single
            />

            <FieldLabel>
              When do you want to be job-ready?
            </FieldLabel>

            <ChoiceGrid
              items={TIMELINES}
              selected={[form.timeline]}
              onClick={(item) =>
                update('timeline', item)
              }
              single
            />
          </Step>
        )}

        {error && (
          <div
            style={{
              marginTop: 20,
              padding: 14,
              borderRadius: 10,
              border: `1px solid ${colors.coral}`,
              color: colors.coral,
              background: colors.panel,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 30,
          }}
        >
          <button
            onClick={back}
            disabled={step === 1 || loading}
            style={{
              ...secondaryButton,
              opacity:
                step === 1 || loading ? 0.4 : 1,
            }}
          >
            ← Back
          </button>

          <button
            onClick={next}
            disabled={loading}
            style={btnPrimary}
          >
            {loading
              ? 'Analyzing...'
              : step === totalSteps
              ? 'Analyze my career →'
              : 'Continue →'}
          </button>
        </div>
      </main>
    </div>
  )
}

function Step({
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 11,
            color: colors.teal,
            letterSpacing: 1,
          }}
        >
          {eyebrow}
        </div>

        <h1
          style={{
            fontFamily: fonts.serif,
            fontSize: 38,
            margin: '8px 0',
          }}
        >
          {title}
        </h1>

        <p
          style={{
            color: colors.muted,
            lineHeight: 1.6,
            maxWidth: 680,
          }}
        >
          {description}
        </p>
      </div>

      {children}
    </>
  )
}

function ChoiceGrid({
  items,
  selected,
  onClick,
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12,
      }}
    >
      {items.map((item) => {
        const active = selected.includes(item)

        return (
          <button
            key={item}
            onClick={() => onClick(item)}
            style={{
              ...choiceStyle,
              borderColor: active
                ? colors.teal
                : colors.line,
              color: active
                ? colors.teal
                : colors.paper,
              background: active
                ? 'rgba(80, 200, 180, 0.07)'
                : colors.panel,
            }}
          >
            {active ? '✓ ' : ''}
            {item}
          </button>
        )
      })}
    </div>
  )
}

function FieldLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 11,
        color: colors.muted,
        textTransform: 'uppercase',
        margin: '22px 0 8px',
      }}
    >
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#111916',
  color: '#F2F5F3',
  border: '1px solid #293631',
  borderRadius: 10,
  padding: '13px 14px',
  fontSize: 14,
  outline: 'none',
}

const choiceStyle = {
  background: '#111916',
  border: '1px solid #293631',
  borderRadius: 12,
  padding: '15px 14px',
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: 13,
  minHeight: 55,
}

const secondaryButton = {
  background: 'transparent',
  border: '1px solid #293631',
  color: '#F2F5F3',
  borderRadius: 9,
  padding: '11px 17px',
  cursor: 'pointer',
}