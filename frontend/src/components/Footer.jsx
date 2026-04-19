import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <span>Department of Computer Engineering</span>
        <span className={styles.sep}>|</span>
        <span>University of Peradeniya</span>
        <span className={styles.sep}>|</span>
        <span>© 2025</span>
        <span className={styles.sep}>|</span>
        <div className={styles.socials}>
          <a href="#" className={styles.social}>f</a>
          <a href="#" className={styles.social}>𝕏</a>
          <a href="#" className={styles.social}>▶</a>
        </div>
      </div>
      <div className={styles.bottom}>
        <a href="/">Home</a>
        <span>|</span>
        <a href="/about">About</a>
        <span>|</span>
        <a href="/scholarships-public">Scholarships</a>
        <span>|</span>
        <a href="/contact">Contact</a>
      </div>
    </footer>
  )
}