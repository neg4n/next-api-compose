import fs from 'fs/promises'
import path from 'path'

export default function HomePage({ apiRoutes }) {
  return (
    <div
      style={{
        fontFamily:
          '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
        marginTop: '6rem',
        maxWidth: '56.4rem',
        marginLeft: 'auto',
        marginRight: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h1>Choose an example:</h1>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {apiRoutes.map((route: string) => (
            <li key={route} style={{ marginBottom: '1rem' }}>
              <a
                style={{ fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none' }}
                href={`api/${route}`}
              >
                {route}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export async function getStaticProps() {
  const apiFiles = await fs.readdir(path.resolve('./pages/api'))

  const apiRoutes = apiFiles
    .filter((file) => !file.startsWith('.'))
    .map((file) => file.substr(0, file.indexOf('.')))

  return {
    props: {
      apiRoutes
    }
  }
}
