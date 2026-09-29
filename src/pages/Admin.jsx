import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Settings from './Settings'
import './Admin.css'

function Admin() {
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [services, setServices] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [page, setPage] = useState('dashboard')

  useEffect(() => {
    checkAdmin()
  }, [])

  async function checkAdmin() {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/'
      return
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (error || profile?.role !== 'admin') {
      alert('You do not have admin access.')
      window.location.href = '/'
      return
    }

    setIsAdmin(true)

    await Promise.all([
      loadAppointments(),
      loadServices()
    ])

    setLoading(false)
  }

  async function loadAppointments() {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        user_id,
        service_id,
        date,
        time,
        notes,
        status,
        created_at,
        services (
          title,
          subtitle,
          price
        )
      `)
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (error) {
      console.error('Appointments error:', error)
      return
    }

    const userIds = [
      ...new Set(
        (data || [])
          .map(appointment => appointment.user_id)
          .filter(Boolean)
      )
    ]

    let profiles = []

    if (userIds.length > 0) {
      const {
        data: profileData,
        error: profileError
      } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', userIds)

      if (profileError) {
        console.error(
          'Profiles error:',
          profileError
        )
      } else {
        profiles = profileData || []
      }
    }

    const profileMap = {}

    profiles.forEach(profile => {
      profileMap[profile.id] = profile
    })

    const enrichedAppointments = (data || []).map(
      appointment => ({
        ...appointment,
        full_name:
          profileMap[appointment.user_id]?.full_name ||
          'No name',
        phone:
          profileMap[appointment.user_id]?.phone || ''
      })
    )

    setAppointments(enrichedAppointments)
  }

  async function loadServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.error('Services error:', error)
      return
    }

    setServices(data || [])
  }

  async function updateStatus(id, status) {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    await loadAppointments()
  }

  async function deleteAppointment(id) {
    const confirmed = window.confirm(
      'Delete this appointment?'
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    await loadAppointments()
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="adminLoading">
        <h1>MN</h1>
        <p>Loading admin dashboard...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const pendingCount = appointments.filter(
    appointment => appointment.status === 'pending'
  ).length

  const confirmedCount = appointments.filter(
    appointment => appointment.status === 'confirmed'
  ).length

  const completedCount = appointments.filter(
    appointment => appointment.status === 'completed'
  ).length

  const cancelledCount = appointments.filter(
    appointment => appointment.status === 'cancelled'
  ).length

  if (page === 'settings') {
    return (
      <div className="adminPage">
        <header className="adminHeader">
          <div className="adminBrand">
            <strong>MN</strong>

            <div>
              <span>MN AESTHETIC</span>
              <small>ADMIN PANEL</small>
            </div>
          </div>

          <div className="adminHeaderActions">
            <button
              onClick={() => setPage('dashboard')}
            >
              Dashboard
            </button>

            <button
              onClick={() => {
                window.location.href = '/'
              }}
            >
              Website
            </button>

            <button onClick={logout}>
              Log out
            </button>
          </div>
        </header>

        <div className="adminNavigation">
          <button
            className="adminNavButton"
            onClick={() => setPage('dashboard')}
          >
            Dashboard
          </button>

          <button
            className="adminNavButton active"
            onClick={() => setPage('settings')}
          >
            Website Settings
          </button>
        </div>

        <Settings />
      </div>
    )
  }

  return (
    <div className="adminPage">
      <header className="adminHeader">
        <div className="adminBrand">
          <strong>MN</strong>

          <div>
            <span>MN AESTHETIC</span>
            <small>ADMIN PANEL</small>
          </div>
        </div>

        <div className="adminHeaderActions">
          <button
            onClick={() => setPage('settings')}
          >
            Website Settings
          </button>

          <button
            onClick={() => {
              window.location.href = '/'
            }}
          >
            Website
          </button>

          <button onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <div className="adminNavigation">
        <button
          className="adminNavButton active"
          onClick={() => setPage('dashboard')}
        >
          Dashboard
        </button>

        <button
          className="adminNavButton"
          onClick={() => setPage('settings')}
        >
          Website Settings
        </button>
      </div>

      <main className="adminContent">
        <div className="adminWelcome">
          <div>
            <span>CONTROL CENTER</span>

            <h1>Dashboard</h1>

            <p>
              Manage appointments and your beauty services.
            </p>
          </div>

          <button
            className="refreshButton"
            onClick={() => {
              loadAppointments()
              loadServices()
            }}
          >
            ↻ Refresh
          </button>
        </div>

        <div className="adminStats">
          <div className="statCard">
            <span>Total appointments</span>
            <strong>{appointments.length}</strong>
          </div>

          <div className="statCard">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>

          <div className="statCard">
            <span>Confirmed</span>
            <strong>{confirmedCount}</strong>
          </div>

          <div className="statCard">
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
        </div>

        <section className="adminSection">
          <div className="sectionHeading">
            <div>
              <span>BOOKINGS</span>
              <h2>Appointments</h2>
            </div>

            <span className="appointmentCount">
              {appointments.length} total
            </span>
          </div>

          <div className="appointmentsTable">
            <div className="tableHeader">
              <span>Customer</span>
              <span>Service</span>
              <span>Date</span>
              <span>Time</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            {appointments.length === 0 ? (
              <div className="emptyAdmin">
                <div>✦</div>

                <h3>No appointments yet</h3>

                <p>
                  New bookings will appear here.
                </p>
              </div>
            ) : (
              appointments.map(appointment => (
                <div
                  className="appointmentRowAdmin"
                  key={appointment.id}
                >
                  <div className="customerCell">
                    <strong>
                      {appointment.full_name}
                    </strong>

                    {appointment.phone && (
                      <small>
                        {appointment.phone}
                      </small>
                    )}
                  </div>

                  <div className="serviceCell">
                    <strong>
                      {appointment.services?.title ||
                        'Unknown service'}
                    </strong>

                    <small>
                      {appointment.services?.subtitle ||
                        ''}
                    </small>
                  </div>

                  <div>
                    {appointment.date}
                  </div>

                  <div>
                    {String(
                      appointment.time || ''
                    ).slice(0, 5)}
                  </div>

                  <div>
                    <select
                      value={appointment.status}
                      onChange={e =>
                        updateStatus(
                          appointment.id,
                          e.target.value
                        )
                      }
                    >
                      <option value="pending">
                        Pending
                      </option>

                      <option value="confirmed">
                        Confirmed
                      </option>

                      <option value="completed">
                        Completed
                      </option>

                      <option value="cancelled">
                        Cancelled
                      </option>
                    </select>
                  </div>

                  <button
                    className="deleteButton"
                    onClick={() =>
                      deleteAppointment(
                        appointment.id
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="adminSection">
          <div className="sectionHeading">
            <div>
              <span>SERVICES</span>

              <h2>Current services</h2>
            </div>
          </div>

          <div className="servicesAdminGrid">
            {services.length === 0 ? (
              <div className="emptyAdmin">
                <p>No services found.</p>
              </div>
            ) : (
              services.map(service => (
                <div
                  className="serviceAdminCard"
                  key={service.id}
                >
                  <div className="serviceAdminNumber">
                    0{service.id}
                  </div>

                  <h3>{service.title}</h3>

                  <p>{service.subtitle}</p>

                  <strong>
                    {service.price} GEL
                  </strong>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="adminSection">
          <div className="sectionHeading">
            <div>
              <span>OVERVIEW</span>

              <h2>Booking status</h2>
            </div>
          </div>

          <div className="statusOverview">
            <div>
              <span className="statusDot pendingDot"></span>

              <span>Pending</span>

              <strong>{pendingCount}</strong>
            </div>

            <div>
              <span className="statusDot confirmedDot"></span>

              <span>Confirmed</span>

              <strong>{confirmedCount}</strong>
            </div>

            <div>
              <span className="statusDot completedDot"></span>

              <span>Completed</span>

              <strong>{completedCount}</strong>
            </div>

            <div>
              <span className="statusDot cancelledDot"></span>

              <span>Cancelled</span>

              <strong>{cancelledCount}</strong>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Admin

