import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Admin from './pages/Admin'

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
      description:
        'თანამედროვე სილამაზის ცენტრი, სადაც თანამედროვე პროცედურები და მშვიდი, ელეგანტური გარემო ერთიანდება.',
      button: 'ვიზიტის დაჯავშნა',
      explore: 'მომსახურებების ნახვა'
    },
    about: {
      title: 'პატარა დეტალები.',
      titleItalic: 'დიდი განსხვავება.',
      paragraph1:
        'MN Aesthetic შეიქმნა ერთი მარტივი იდეით: შენი სილამაზის ვიზიტი ისეთივე სასიამოვნო უნდა იყოს, როგორც საბოლოო შედეგი.',
      paragraph2:
        'დიოდური ლაზერული ეპილაციიდან დაწყებული, პედიკურით დამთავრებული, თითოეული მომსახურება შექმნილია შენთვის მშვიდი და კომფორტული გამოცდილების მისაცემად.'
    },
    services: {
      1: {
        title: 'დიოდური ლაზერი',
        subtitle: 'ეპილაცია',
        description:
          'კომფორტული დიოდური ლაზერული პროცედურა ინდივიდუალური მიდგომით.',
        price: '40 GEL-დან'
      },
      2: {
        title: 'ფრჩხილები და',
        subtitle: 'პედიკური',
        description:
          'ფრჩხილების მოვლა და პედიკური სუფთა და დახვეწილი შედეგისთვის.',
        price: '35 GEL-დან'
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
      description:
        'A modern beauty center where advanced treatments meet a calm, elegant experience made around you.',
      button: 'Book an appointment',
      explore: 'Explore services'
    },
    about: {
      title: 'Small details.',
      titleItalic: 'Big difference.',
      paragraph1:
        'MN Aesthetic was created around a simple idea: your beauty appointment should feel just as good as the result.',
      paragraph2:
        'From diode laser hair removal to carefully finished pedicures, every service is designed to be personal, calm and effortless.'
    },
    services: {
      1: {
        title: 'Diode Laser',
        subtitle: 'Hair Removal',
        description:
          'Smooth, comfortable diode laser treatment with a personalized approach.',
        price: 'From 40 GEL'
      },
      2: {
        title: 'Nails &',
        subtitle: 'Pedicure',
        description:
          'Elegant nail care and pedicure services designed for a clean, polished finish.',
        price: 'From 35 GEL'
      }
    }
  }
}

const DEFAULT_SERVICES = [
  {
    id: 1,
    tag: 'POPULAR'
  },
  {
    id: 2,
    tag: 'BEAUTY'
  }
]

const TIME_OPTIONS = []

for (let hour = 9; hour <= 21; hour++) {
  for (const minute of ['00', '30']) {
    if (hour === 21 && minute === '30') continue

    TIME_OPTIONS.push(
      `${String(hour).padStart(2, '0')}:${minute}`
    )
  }
}

function App() {
  const [authOpen, setAuthOpen] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [authMode, setAuthMode] = useState('register')
  const [user, setUser] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [selectedService, setSelectedService] = useState(1)
  const [isAdmin, setIsAdmin] = useState(false)

  const [siteSettings, setSiteSettings] = useState(null)
  const [siteLoading, setSiteLoading] = useState(true)

  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: ''
  })

  const [booking, setBooking] = useState({
    date: '',
    time: '',
    notes: ''
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSiteSettings()
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!mounted) return

      const currentUser = session?.user ?? null

      setUser(currentUser)

      if (currentUser) {
        await loadAppointments(currentUser)
        await checkAdmin(currentUser)
      }
    }

    loadSession()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null

        setUser(currentUser)

        if (currentUser) {
          setTimeout(() => {
            loadAppointments(currentUser)
            checkAdmin(currentUser)
          }, 0)
        } else {
          setAppointments([])
          setIsAdmin(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function loadSiteSettings() {
    const { data, error: settingsError } =
      await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single()

    if (settingsError) {
      console.error(
        'Site settings error:',
        settingsError
      )

      setSiteSettings({
        language: 'ka',
        content: DEFAULT_CONTENT
      })
    } else {
      setSiteSettings(data)
    }

    setSiteLoading(false)
  }

  async function checkAdmin(currentUser) {
    if (!currentUser) {
      setIsAdmin(false)
      return
    }

    const { data, error: adminError } =
      await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single()

    if (adminError) {
      console.error(
        'Admin check error:',
        adminError
      )

      setIsAdmin(false)
      return
    }

    setIsAdmin(data?.role === 'admin')
  }

  async function loadAppointments(currentUser = user) {
    if (!currentUser) return

    const { data, error: queryError } =
      await supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          notes,
          status,
          service_id,
          services (
            title,
            subtitle,
            price
          )
        `)
        .eq('user_id', currentUser.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true })

    if (!queryError) {
      setAppointments(data || [])
    }
  }

  function openBooking(serviceId = 1) {
    setSelectedService(serviceId)
    setError('')
    setBookingOpen(true)
  }

  function openAuth(mode = 'register') {
    setAuthMode(mode)
    setError('')
    setAuthOpen(true)
  }

  async function submitAuth(event) {
    event.preventDefault()

    setLoading(true)
    setError('')

    try {
      if (authMode === 'register') {
        const { data, error: signUpError } =
          await supabase.auth.signUp({
            email: authForm.email,
            password: authForm.password,
            options: {
              data: {
                full_name: authForm.name
              }
            }
          })

        if (signUpError) {
          throw signUpError
        }

        if (!data.session) {
          setAuthOpen(false)

          setAuthForm({
            name: '',
            email: '',
            password: ''
          })

          alert(
            'Account created. Check your email to confirm your account, then log in.'
          )
        } else {
          setAuthOpen(false)

          setAuthForm({
            name: '',
            email: '',
            password: ''
          })
        }
      } else {
        const { error: loginError } =
          await supabase.auth.signInWithPassword({
            email: authForm.email,
            password: authForm.password
          })

        if (loginError) {
          throw loginError
        }

        setAuthOpen(false)

        setAuthForm({
          name: '',
          email: '',
          password: ''
        })
      }
    } catch (authError) {
      setError(
        authError.message ||
          'Something went wrong.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function submitBooking(event) {
    event.preventDefault()

    if (!user) {
      setBookingOpen(false)
      openAuth('register')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: insertError } =
        await supabase
          .from('appointments')
          .insert({
            user_id: user.id,
            service_id: selectedService,
            date: booking.date,
            time: booking.time,
            notes: booking.notes
          })

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error(
            'That date and time is already booked. Please choose another time.'
          )
        }

        throw insertError
      }

      setBookingOpen(false)

      setBooking({
        date: '',
        time: '',
        notes: ''
      })

      await loadAppointments()

      alert('Appointment booked successfully.')
    } catch (bookingError) {
      setError(
        bookingError.message ||
          'Could not create appointment.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()

    setUser(null)
    setAppointments([])
    setIsAdmin(false)

    if (window.location.pathname === '/admin') {
      window.location.href = '/'
    }
  }

  function scrollTo(id) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'smooth' })
  }

  const language =
    siteSettings?.language || 'ka'

  const content =
    siteSettings?.content?.[language] ||
    DEFAULT_CONTENT[language]

  const images =
    siteSettings?.content?.images || {}

  const services = DEFAULT_SERVICES.map(
    service => ({
      ...service,
      ...(content.services?.[service.id] || {})
    })
  )

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Guest'

  if (window.location.pathname === '/admin') {
    return <Admin />
  }

  if (siteLoading) {
    return (
      <div className="app">
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div className="eyebrow">
            MN AESTHETIC
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="navbar">
        <button
          className="brand"
          onClick={() => scrollTo('home')}
        >
          <span>MN</span>
          <small>AESTHETIC</small>
        </button>

        <nav>
          <button onClick={() => scrollTo('services')}>
            {content.nav.services}
          </button>

          <button onClick={() => scrollTo('about')}>
            {content.nav.about}
          </button>

          <button onClick={() => scrollTo('contact')}>
            {content.nav.contact}
          </button>
        </nav>

        <div className="navActions">
          {isAdmin && (
            <button
              className="accountButton adminNavButton"
              onClick={() => {
                window.location.href = '/admin'
              }}
            >
              {content.nav.admin}
            </button>
          )}

          {user ? (
            <button
              className="accountButton"
              onClick={() => scrollTo('account')}
            >
              {userName.split(' ')[0]}
            </button>
          ) : (
            <button
              className="outlineButton"
              onClick={() => openAuth('register')}
            >
              {content.nav.register}
            </button>
          )}

          <button
            className="menuButton"
            onClick={() => scrollTo('services')}
          >
            ☰
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="heroContent">
            <div className="eyebrow">
              <span></span>
              BEAUTY • CARE • CONFIDENCE
            </div>

            <h1>
              {content.hero.title}
              <br />
              <i>{content.hero.titleItalic}</i>
            </h1>

            <p className="heroText">
              {content.hero.description}
            </p>

            <div className="heroActions">
              <button
                className="primaryButton"
                onClick={() => openBooking(1)}
              >
                {content.hero.button}{' '}
                <span>↗</span>
              </button>

              <button
                className="textButton"
                onClick={() => scrollTo('services')}
              >
                {content.hero.explore}
              </button>
            </div>

            <div className="heroMeta">
              <div>
                <strong>02</strong>

                <span>
                  {language === 'ka' ? (
                    <>
                      მთავარი
                      <br />
                      მომსახურება
                    </>
                  ) : (
                    <>
                      Signature
                      <br />
                      services
                    </>
                  )}
                </span>
              </div>

              <div>
                <strong>01</strong>

                <span>
                  {language === 'ka' ? (
                    <>
                      მარტივი
                      <br />
                      დაჯავშნა
                    </>
                  ) : (
                    <>
                      Simple
                      <br />
                      booking
                    </>
                  )}
                </span>
              </div>

              <div>
                <strong>100%</strong>

                <span>
                  {language === 'ka' ? (
                    <>
                      პირადი
                      <br />
                      ზრუნვა
                    </>
                  ) : (
                    <>
                      Personal
                      <br />
                      care
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="heroVisual">
            <div
              className="visualFrame"
              style={
                images.hero
                  ? {
                      backgroundImage: `url("${images.hero}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }
                  : undefined
              }
            >
              {!images.hero && (
                <>
                  <div className="softGlow"></div>

                  <div className="visualCircle">
                    <div className="monogram">
                      MN
                    </div>

                    <div className="visualCaption">
                      AESTHETIC STUDIO
                    </div>
                  </div>
                </>
              )}

              <div className="floatingCard">
                <span>✦</span>

                <div>
                  <strong>
                    {language === 'ka'
                      ? 'იგრძენი სილამაზე.'
                      : 'Feel beautiful.'}
                  </strong>

                  <small>
                    {language === 'ka'
                      ? 'იგრძენი თავი შენსავით.'
                      : 'Feel like yourself.'}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="servicesSection"
          id="services"
        >
          <div className="sectionIntro">
            <div>
              <div className="eyebrow">
                {language === 'ka'
                  ? 'ჩვენი მომსახურება'
                  : 'OUR SERVICES'}
              </div>

              <h2>
                {language === 'ka'
                  ? 'სილამაზე,'
                  : 'Beauty,'}{' '}
                <i>
                  {language === 'ka'
                    ? 'დახვეწილი.'
                    : 'refined.'}
                </i>
              </h2>
            </div>

            <p>
              {language === 'ka'
                ? 'ფრთხილად შერჩეული პროცედურები. სუფთა შედეგები. კომფორტული გამოცდილება თავიდან ბოლომდე.'
                : 'Thoughtful treatments. Clean results. A comfortable experience from start to finish.'}
            </p>
          </div>

          <div className="serviceGrid">
            {services.map(service => (
              <article
                className="serviceCard"
                key={service.id}
              >
                <div className="serviceTop">
                  <span className="serviceNumber">
                    0{service.id}
                  </span>

                  <span className="serviceTag">
                    {service.tag}
                  </span>
                </div>

                <div
                  className="serviceArt"
                  style={
                    images[`service-${service.id}`]
                      ? {
                          backgroundImage: `url("${images[`service-${service.id}`]}")`,
                          backgroundSize: 'cover',
                          backgroundPosition:
                            'center'
                        }
                      : undefined
                  }
                >
                  {!images[
                    `service-${service.id}`
                  ] &&
                    (service.id === 1 ? (
                      <div className="laserArt">
                        <div className="laserRing"></div>
                        <div className="laserLine"></div>
                        <span>LASER</span>
                      </div>
                    ) : (
                      <div className="nailArt">
                        <div className="nailShape"></div>
                        <span>CARE</span>
                      </div>
                    ))}
                </div>

                <h3>
                  {service.title}
                  <br />
                  <i>{service.subtitle}</i>
                </h3>

                <p>{service.description}</p>

                <div className="serviceBottom">
                  <span>{service.price}</span>

                  <button
                    onClick={() =>
                      openBooking(service.id)
                    }
                  >
                    {language === 'ka'
                      ? 'დაჯავშნა'
                      : 'Book now'}{' '}
                    <b>→</b>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="aboutSection"
          id="about"
        >
          <div
            className="aboutImage"
            style={
              images.about
                ? {
                    backgroundImage: `url("${images.about}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }
                : undefined
            }
          >
            {!images.about && (
              <div className="aboutSeal">
                MN
                <br />
                <small>AESTHETIC</small>
              </div>
            )}

            <span className="verticalText">
              {language === 'ka'
                ? 'შენი სილამაზე, შენი მომენტი'
                : 'YOUR BEAUTY, YOUR MOMENT'}
            </span>
          </div>

          <div className="aboutContent">
            <div className="eyebrow">
              {language === 'ka'
                ? 'MN გამოცდილება'
                : 'THE MN EXPERIENCE'}
            </div>

            <h2>
              {content.about.title}
              <br />
              <i>{content.about.titleItalic}</i>
            </h2>

            <p>
              {content.about.paragraph1}
            </p>

            <p>
              {content.about.paragraph2}
            </p>

            <button
              className="darkButton"
              onClick={() => openBooking(1)}
            >
              {language === 'ka'
                ? 'დაჯავშნე ვიზიტი'
                : 'Make an appointment'}{' '}
              <span>↗</span>
            </button>
          </div>
        </section>

        {user && (
          <section
            className="accountSection"
            id="account"
          >
            <div className="accountHeader">
              <div>
                <div className="eyebrow">
                  {language === 'ka'
                    ? 'შენი ანგარიში'
                    : 'YOUR ACCOUNT'}
                </div>

                <h2>
                  {language === 'ka'
                    ? 'კეთილი იყოს შენი მობრძანება, '
                    : 'Welcome, '}

                  <i>
                    {userName.split(' ')[0]}.
                  </i>
                </h2>
              </div>

              <button
                className="outlineButton"
                onClick={logout}
              >
                {language === 'ka'
                  ? 'გასვლა'
                  : 'Log out'}
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="emptyState">
                <span>✦</span>

                <h3>
                  {language === 'ka'
                    ? 'ვიზიტები ჯერ არ გაქვს'
                    : 'No appointments yet'}
                </h3>

                <p>
                  {language === 'ka'
                    ? 'აირჩიე პროცედურა და დაჯავშნე პირველი ვიზიტი.'
                    : 'Choose a treatment and reserve your first visit.'}
                </p>

                <button
                  className="primaryButton"
                  onClick={() => openBooking(1)}
                >
                  {language === 'ka'
                    ? 'დაჯავშნა'
                    : 'Book now'}
                </button>
              </div>
            ) : (
              <div className="appointmentList">
                {appointments.map(item => (
                  <div
                    className="appointmentRow"
                    key={item.id}
                  >
                    <div>
                      <span className="statusDot"></span>

                      <strong>
                        {item.services?.title}{' '}
                        {item.services?.subtitle}
                      </strong>
                    </div>

                    <span>
                      {item.date} ·{' '}
                      {String(
                        item.time || ''
                      ).slice(0, 5)}
                    </span>

                    <span
                      className={`status ${item.status}`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section
          className="ctaSection"
          id="contact"
        >
          <div className="eyebrow">
            {language === 'ka'
              ? 'როცა მზად იქნები'
              : 'READY WHEN YOU ARE'}
          </div>

          <h2>
            {language === 'ka'
              ? 'დრო დაუთმე '
              : 'Make time for '}
            <i>
              {language === 'ka'
                ? 'საკუთარ თავს.'
                : 'yourself.'}
            </i>
          </h2>

          <p>
            {language === 'ka'
              ? 'აირჩიე პროცედურა. აირჩიე დრო. დანარჩენს ჩვენ მივხედავთ.'
              : "Choose your treatment. Pick your time. We'll take care of the rest."}
          </p>

          <button
            className="lightButton"
            onClick={() => openBooking(1)}
          >
            {language === 'ka'
              ? 'დაჯავშნე ვიზიტი'
              : 'Book your visit'}{' '}
            <span>↗</span>
          </button>
        </section>
      </main>

      <footer>
        <div className="footerBrand">
          <span>MN</span>
          <small>AESTHETIC</small>
        </div>

        <div className="footerInfo">
          <span>
            {language === 'ka'
              ? 'სილამაზე • ზრუნვა • თავდაჯერება'
              : 'Beauty • Care • Confidence'}
          </span>

          <span>
            © 2026 MN Aesthetic
          </span>
        </div>
      </footer>

      {bookingOpen && (
        <div
          className="modalOverlay"
          onMouseDown={e => {
            if (e.target === e.currentTarget) {
              setBookingOpen(false)
            }
          }}
        >
          <div className="modal">
            <button
              className="closeButton"
              onClick={() => setBookingOpen(false)}
            >
              ×
            </button>

            <div className="eyebrow">
              {language === 'ka'
                ? 'ონლაინ დაჯავშნა'
                : 'ONLINE BOOKING'}
            </div>

            <h2>
              {language === 'ka'
                ? 'დაჯავშნე შენი '
                : 'Reserve your '}
              <i>
                {language === 'ka'
                  ? 'ვიზიტი.'
                  : 'visit.'}
              </i>
            </h2>

            {!user ? (
              <div className="authRequired">
                <div className="authIcon">
                  MN
                </div>

                <p>
                  {language === 'ka'
                    ? 'შექმენი უფასო ანგარიში, რათა ონლაინ მართო შენი ვიზიტები.'
                    : 'Create a free account so you can manage your appointments online.'}
                </p>

                <button
                  className="primaryButton full"
                  onClick={() => {
                    setBookingOpen(false)
                    openAuth('register')
                  }}
                >
                  {language === 'ka'
                    ? 'ანგარიშის შექმნა'
                    : 'Create account'}
                </button>

                <button
                  className="textButton"
                  onClick={() => {
                    setBookingOpen(false)
                    openAuth('login')
                  }}
                >
                  {language === 'ka'
                    ? 'უკვე გაქვს ანგარიში? შესვლა'
                    : 'Already have an account? Log in'}
                </button>
              </div>
            ) : (
              <form onSubmit={submitBooking}>
                <label>
                  {language === 'ka'
                    ? 'მომსახურება'
                    : 'Service'}

                  <select
                    value={selectedService}
                    onChange={e =>
                      setSelectedService(
                        Number(e.target.value)
                      )
                    }
                  >
                    {services.map(service => (
                      <option
                        value={service.id}
                        key={service.id}
                      >
                        {service.title}{' '}
                        {service.subtitle}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="formRow">
                  <label>
                    {language === 'ka'
                      ? 'თარიღი'
                      : 'Date'}

                    <input
                      type="date"
                      required
                      min={
                        new Date()
                          .toISOString()
                          .split('T')[0]
                      }
                      value={booking.date}
                      onChange={e =>
                        setBooking({
                          ...booking,
                          date: e.target.value
                        })
                      }
                    />
                  </label>

                  <label>
                    {language === 'ka'
                      ? 'დრო'
                      : 'Time'}

                    <select
                      required
                      value={booking.time}
                      onChange={e =>
                        setBooking({
                          ...booking,
                          time: e.target.value
                        })
                      }
                    >
                      <option value="">
                        {language === 'ka'
                          ? 'აირჩიე დრო'
                          : 'Select time'}
                      </option>

                      {TIME_OPTIONS.map(time => (
                        <option
                          value={time}
                          key={time}
                        >
                          {time}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  {language === 'ka'
                    ? 'შენიშვნა'
                    : 'Notes'}

                  <textarea
                    rows="3"
                    placeholder={
                      language === 'ka'
                        ? 'არის რამე, რაც უნდა ვიცოდეთ?'
                        : "Anything you'd like us to know?"
                    }
                    value={booking.notes}
                    onChange={e =>
                      setBooking({
                        ...booking,
                        notes: e.target.value
                      })
                    }
                  ></textarea>
                </label>

                {error && (
                  <div className="formError">
                    {error}
                  </div>
                )}

                <button
                  className="primaryButton full"
                  disabled={loading}
                >
                  {loading
                    ? language === 'ka'
                      ? 'იტვირთება...'
                      : 'Booking...'
                    : language === 'ka'
                      ? 'ვიზიტის დაჯავშნა ↗'
                      : 'Book appointment ↗'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {authOpen && (
        <div
          className="modalOverlay"
          onMouseDown={e => {
            if (e.target === e.currentTarget) {
              setAuthOpen(false)
            }
          }}
        >
          <div className="modal">
            <button
              className="closeButton"
              onClick={() => setAuthOpen(false)}
            >
              ×
            </button>

            <div className="eyebrow">
              {authMode === 'register'
                ? language === 'ka'
                  ? 'კეთილი იყოს შენი მობრძანება'
                  : 'WELCOME TO MN'
                : language === 'ka'
                  ? 'კეთილი იყოს შენი დაბრუნება'
                  : 'WELCOME BACK'}
            </div>

            <h2>
              {authMode === 'register' ? (
                <>
                  {language === 'ka'
                    ? 'შექმენი შენი '
                    : 'Create your '}

                  <i>
                    {language === 'ka'
                      ? 'ანგარიში.'
                      : 'account.'}
                  </i>
                </>
              ) : (
                <>
                  {language === 'ka'
                    ? 'შედი შენს '
                    : 'Log in to your '}

                  <i>
                    {language === 'ka'
                      ? 'ანგარიშში.'
                      : 'account.'}
                  </i>
                </>
              )}
            </h2>

            <form onSubmit={submitAuth}>
              {authMode === 'register' && (
                <label>
                  {language === 'ka'
                    ? 'სრული სახელი'
                    : 'Full name'}

                  <input
                    required
                    placeholder={
                      language === 'ka'
                        ? 'შენი სახელი'
                        : 'Your name'
                    }
                    value={authForm.name}
                    onChange={e =>
                      setAuthForm({
                        ...authForm,
                        name: e.target.value
                      })
                    }
                  />
                </label>
              )}

              <label>
                Email

                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={authForm.email}
                  onChange={e =>
                    setAuthForm({
                      ...authForm,
                      email: e.target.value
                    })
                  }
                />
              </label>

              <label>
                {language === 'ka'
                  ? 'პაროლი'
                  : 'Password'}

                <input
                  required
                  minLength="6"
                  type="password"
                  placeholder={
                    language === 'ka'
                      ? 'მინიმუმ 6 სიმბოლო'
                      : 'At least 6 characters'
                  }
                  value={authForm.password}
                  onChange={e =>
                    setAuthForm({
                      ...authForm,
                      password: e.target.value
                    })
                  }
                />
              </label>

              {error && (
                <div className="formError">
                  {error}
                </div>
              )}

              <button
                className="primaryButton full"
                disabled={loading}
              >
                {loading
                  ? language === 'ka'
                    ? 'გთხოვ დაელოდო...'
                    : 'Please wait...'
                  : authMode === 'register'
                    ? language === 'ka'
                      ? 'ანგარიშის შექმნა ↗'
                      : 'Create account ↗'
                    : language === 'ka'
                      ? 'შესვლა ↗'
                      : 'Log in ↗'}
              </button>
            </form>

            <button
              className="switchAuth"
              onClick={() => {
                setAuthMode(
                  authMode === 'register'
                    ? 'login'
                    : 'register'
                )

                setError('')
              }}
            >
              {authMode === 'register'
                ? language === 'ka'
                  ? 'უკვე გაქვს ანგარიში? შესვლა'
                  : 'Already have an account? Log in'
                : language === 'ka'
                  ? 'არ გაქვს ანგარიში? რეგისტრაცია'
                  : 'Need an account? Register'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

