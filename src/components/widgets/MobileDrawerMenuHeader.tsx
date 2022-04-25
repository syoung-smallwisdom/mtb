import BlackXIcon from '@assets/black_x_icon.svg'
import Logo from '@assets/logo_mtb.svg'
import makeStyles from '@mui/styles/makeStyles'
import {latoFont} from '@style/theme'
import React from 'react'
import {NavLink} from 'react-router-dom'

const useStyles = makeStyles(theme => ({
  blackXIcon: {
    width: '16px',
    height: '16px',
  },
  mobileToolBarLink: {
    fontFamily: latoFont,
    textDecoration: 'none',
    color: 'inherit',
    flexShrink: 0,
    boxSizing: 'border-box',
    paddingLeft: theme.spacing(3),
    display: 'flex',
    alignItems: 'center',
  },
  mobileHomeOptionContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    paddingRight: theme.spacing(3),
    height: '100px',
    justifyContent: 'space-between',
  },
  logoImage: {
    height: '30px',
    '&:hover': {
      opacity: 0.7,
    },
  },
}))

type MobileDrawHeaderProps = {
  setIsMobileOpen: Function
  type: 'IN_STUDY' | 'LOGGED_IN' | 'NOT_LOGGED_IN'
  logoImage?: JSX.Element
}

const MobileDrawerMenuHeader: React.FunctionComponent<MobileDrawHeaderProps> =
  ({setIsMobileOpen, type, logoImage}) => {
    const classes = useStyles()
    const logo = logoImage || <img className={classes.logoImage} src={Logo} />
    const logoElement =
      type === 'IN_STUDY' || type === 'LOGGED_IN' ? (
        <NavLink
          color="inherit"
          to={'/studies'}
          key="MY STUDIES"
          className={classes.mobileToolBarLink}>
          {logo}
        </NavLink>
      ) : (
        <a
          target="_blank"
          href="https://www.mobiletoolbox.org"
          className={classes.mobileToolBarLink}>
          {logo}
        </a>
      )

    return (
      <div className={classes.mobileHomeOptionContainer}>
        {logoElement}
        <img
          src={BlackXIcon}
          onClick={() => setIsMobileOpen(false)}
          className={classes.blackXIcon}></img>
      </div>
    )
  }

export default MobileDrawerMenuHeader
