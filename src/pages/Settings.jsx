import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import './Settings.css'

const DEFAULT_CONTENT = {
  ka: {
    nav: {
      services: 'მომსახურება',
      about: 'ჩვენ შესახებ',
      contact: 'კონტაქტი',
      register: 'რეგისტრაცია',
      admin: 'ადმინი'
    },
    hero: {
      title: 'შენი სილამაზე,',
      titleItalic: 'ზრუნვას იმსახურებს.',
      description: '',
      button: 'ვიზიტის დაჯავშნა',
      explore: 'მომსახურებების ნახვა'
    },
    about: {
      title: 'პატარა დეტალები.',
      titleItalic: 'დიდი განსხვავება.',
      paragraph1: '',
      paragraph2: ''
    },
    services: {
      1: {
        title: '',
        subtitle: '',
        description: '',
        price: ''
      },
      2: {
        title: '',
        subtitle: '',
        description: '',
        price: ''
      }
    }
  },
  en: {
    nav: {
      services: 'Services',
      about: 'About',
      contact: 'Contact',
      register: 'Register',
      admin: 'Admin'
    },
    hero: {
      title: 'Your beauty,',
      titleItalic: 'beautifully cared for.',
      description: '',
      button: 'Book an appointment',
      explore: 'Explore services'
    },
    about: {
      title: 'Small details.',
      titleItalic: 'Big difference.',
      paragraph1: '',
      paragraph2: ''
    },
    services: {
      1: {
        title: '',
        subtitle: '',
        description: '',
        price: ''
      },
      2: {
        title: '',
        subtitle: '',
        description: '',
        price: ''
      }
    }
  }
}

function Settings() {
  const [language, setLanguage] = useState('ka')
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    if (data?.language) {
      setLanguage(data.language)
    }

    if (data?.content) {
      setContent(data.content)
    }

    setLoading(false)
  }

  function update(path, value) {
    setContent(previous => {
      const updated = structuredClone(previous)

      let current = updated[language]

      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]]
      }

      current[path[path.length - 1]] = value

      return updated
    })
  }

  async function saveSettings() {
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('site_settings')
      .update({
        language,
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)

    if (error) {
      console.error(error)
      setMessage('შენახვა ვერ მოხერხდა.')
    } else {
      setMessage('ცვლილებები შენახულია.')
    }

    setSaving(false)
  }

  async function uploadImage(type) {
    const input = document.createElement('input')

    input.type = 'file'
    input.accept = 'image/*'

    input.onchange = async event => {
      const file = event.target.files?.[0]

      if (!file) return

      setMessage('ფოტო იტვირთება...')

      const extension = file.name.split('.').pop()
      const fileName = `${type}-${Date.now()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('website-images')
        .upload(fileName, file, {
          upsert: true
        })

      if (uploadError) {
        console.error(uploadError)
        setMessage('ფოტოს ატვირთვა ვერ მოხერხდა.')
        return
      }

      const {
        data: { publicUrl }
      } = supabase.storage
        .from('website-images')
        .getPublicUrl(fileName)

      updateImage(type, publicUrl)

      setMessage('ფოტო აიტვირთა. დააჭირე შენახვას.')
    }

    input.click()
  }

  function updateImage(type, url) {
    setContent(previous => {
      const updated = structuredClone(previous)

      if (!updated.images) {
        updated.images = {}
      }

      updated.images[type] = url

      return updated
    })
  }

  const current = content[language] || DEFAULT_CONTENT[language]

  if (loading) {
    return (
      <div className="settingsLoading">
        იტვირთება...
      </div>
    )
  }

  return (
    <div className="settingsPage">
      <div className="settingsTop">
        <div>
          <span>WEBSITE</span>
          <h1>ვებსაიტის მართვა</h1>
          <p>
            შეცვალე საიტის ტექსტები, ენა და ფოტოები.
          </p>
        </div>

        <div className="languageButtons">
          <button
            className={language === 'ka' ? 'active' : ''}
            onClick={() => setLanguage('ka')}
          >
            ქართული
          </button>

          <button
            className={language === 'en' ? 'active' : ''}
            onClick={() => setLanguage('en')}
          >
            English
          </button>
        </div>
      </div>

      <section className="settingsSection">
        <div className="settingsSectionTitle">
          <span>HERO</span>
          <h2>მთავარი გვერდი</h2>
        </div>

        <label>
          მთავარი სათაური

          <input
            value={current.hero.title}
            onChange={e =>
              update(
                ['hero', 'title'],
                e.target.value
              )
            }
          />
        </label>

        <label>
          დახრილი სათაური

          <input
            value={current.hero.titleItalic}
            onChange={e =>
              update(
                ['hero', 'titleItalic'],
                e.target.value
              )
            }
          />
        </label>

        <label>
          აღწერა

          <textarea
            rows="4"
            value={current.hero.description}
            onChange={e =>
              update(
                ['hero', 'description'],
                e.target.value
              )
            }
          />
        </label>

        <label>
          მთავარი ღილაკი

          <input
            value={current.hero.button}
            onChange={e =>
              update(
                ['hero', 'button'],
                e.target.value
              )
            }
          />
        </label>

        <label>
          მომსახურებების ღილაკი

          <input
            value={current.hero.explore}
            onChange={e =>
              update(
                ['hero', 'explore'],
                e.target.value
              )
            }
          />
        </label>

        <button
          className="uploadButton"
          onClick={() => uploadImage('hero')}
        >
          📷 მთავარი ფოტოს ატვირთვა
        </button>
      </section>

      <section className="settingsSection">
        <div className="settingsSectionTitle">
          <span>ABOUT</span>
          <h2>ჩვენ შესახებ</h2>
        </div>

        <label>
          სათაური

          <input
            value={current.about.title}
            onChange={e =>
              update(
                ['about', 'title'],
                e.target.value
              )
            }
          />
        </label>

        <label>
          დახრილი სათაური

          <input
            value={current.about.titleItalic}
            onChange={e =>
              update(
                ['about', 'titleItalic'],
                e.target.value
              )
            }
          />
        </label>

        <label>
          პირველი ტექსტი

          <textarea
            rows="4"
            value={current.about.paragraph1}
            onChange={e =>
              update(
                ['about', 'paragraph1'],
                e.target.value
              )
            }
          />
        </label>

        <label>
          მეორე ტექსტი

          <textarea
            rows="4"
            value={current.about.paragraph2}
            onChange={e =>
              update(
                ['about', 'paragraph2'],
                e.target.value
              )
            }
          />
        </label>

        <button
          className="uploadButton"
          onClick={() => uploadImage('about')}
        >
          📷 About ფოტოს ატვირთვა
        </button>
      </section>

      <section className="settingsSection">
        <div className="settingsSectionTitle">
          <span>SERVICES</span>
          <h2>მომსახურებები</h2>
        </div>

        {[1, 2].map(id => (
          <div className="editableService" key={id}>
            <h3>მომსახურება {id}</h3>

            <label>
              სათაური

              <input
                value={current.services[id].title}
                onChange={e =>
                  update(
                    ['services', id, 'title'],
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              ქვესათაური

              <input
                value={current.services[id].subtitle}
                onChange={e =>
                  update(
                    ['services', id, 'subtitle'],
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              აღწერა

              <textarea
                rows="3"
                value={
                  current.services[id].description
                }
                onChange={e =>
                  update(
                    ['services', id, 'description'],
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              ფასი

              <input
                value={current.services[id].price}
                onChange={e =>
                  update(
                    ['services', id, 'price'],
                    e.target.value
                  )
                }
              />
            </label>

            <button
              className="uploadButton"
              onClick={() =>
                uploadImage(`service-${id}`)
              }
            >
              📷 მომსახურების ფოტოს ატვირთვა
            </button>
          </div>
        ))}
      </section>

      {message && (
        <div className="settingsMessage">
          {message}
        </div>
      )}

      <button
        className="saveSettingsButton"
        onClick={saveSettings}
        disabled={saving}
      >
        {saving
          ? 'ინახება...'
          : 'ცვლილებების შენახვა'}
      </button>
    </div>
  )
}

export default Settings