import useFeatureToggles, {FeatureToggles} from '@helpers/FeatureToggle'
import Utility from '@helpers/utility'
import ClearIcon from '@mui/icons-material/Clear'
import MenuIcon from '@mui/icons-material/Menu'
import {
  Avatar,
  Box,
  Drawer,
  drawerClasses,
  Hidden,
  IconButton,
  Menu,
  MenuItem,
  styled,
  SxProps,
  Toolbar,
  Typography,
  Link,
} from '@mui/material'
import Button from '@mui/material/Button'
import {latoFont, shouldForwardProp, theme} from '@style/theme'
import constants from '@typedefs/constants'
import {NavRouteType, UserSessionData} from '@typedefs/types'
import React, {FunctionComponent} from 'react'
import {useLocation} from 'react-router'
import {NavLink} from 'react-router-dom'
import Logout from '../account/Logout'

const drawerWidth = '320px'

const StyledAppNav = styled(Box, {label: 'StyledAppTopNav1', shouldForwardProp: prop => prop !== 'hasSubNav'})<{
  hasSubNav?: boolean
}>(({theme, hasSubNav}) => ({
  height: hasSubNav ? 'auto' : '122px',

  borderBottom: '1px solid #EAECEE',
  padding: hasSubNav ? theme.spacing(0, 8) : theme.spacing(0, 5),
  [theme.breakpoints.down('lg')]: {
    borderBottom: 'none',
    height: 'auto',
  },
  '&  div.first-of-type': {
    display: 'flex',

    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
}))
const StyledToolBar = styled(Toolbar, {label: 'StyledToolBar', shouldForwardProp: prop => prop !== 'hasSubNav'})<{
  hasSubNav?: boolean
}>(({theme, hasSubNav}) => ({
  padding: hasSubNav ? theme.spacing(2.5, 2) : theme.spacing(4, 2),
  justifyContent: 'space-between',
  overflowX: 'auto',
}))

const StyledToolBarLink = styled(NavLink, {label: 'StyledToolBarLink', shouldForwardProp: shouldForwardProp})<{
  $isDrawerLink?: boolean
}>(({theme, $isDrawerLink}) => ({
  padding: $isDrawerLink ? theme.spacing(2.5, 0) : theme.spacing(1),
  textDecoration: 'none',

  flexShrink: 0,
  //agendel todo Lato
  fontFamily: latoFont,
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '18px',
  lineHeight: '18px',
  color: '#353A3F',
}))

const StyledDrawer = styled(Drawer, {label: 'StyledDrawer'})(({theme}) => ({
  width: drawerWidth,
  flexShrink: 0,

  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,

    padding: theme.spacing(8, 2, 2, 3),
    '& svg': {
      top: '16px',
      right: '16px',
      fontSize: '36px',
      position: 'absolute',
      color: '#878E95',
    },
  },
}))

type AppTopNavProps = {
  hasSubNav?: boolean
  routes: NavRouteType[]
  appId: string
  sessionData?: UserSessionData
  children?: React.ReactNode
}

const MenuLinks: FunctionComponent<
  AppTopNavProps & {
    setIsMobileOpen: Function
    isDrawerLink?: boolean
  }
> = ({routes, setIsMobileOpen, isDrawerLink}) => {
  let links = routes.map(route => (
    <StyledToolBarLink
      $isDrawerLink={isDrawerLink}
      to={route.path}
      key={route.name}
      activeStyle={{
        fontWeight: 800,
        color: theme.palette.primary.main,
      }}
      onClick={() => setIsMobileOpen(false)}>
      {route.name}
    </StyledToolBarLink>
  ))

  return <>{links}</>
}

const ProfileLink: FunctionComponent<{}> = () => (
  <Link
    sx={{textDecoration: 'none', color: '#353A3F', fontSize: '18px'}}
    href={`${Utility.getRedirectLinkToOneSage('profile')}`}>
    My Profile
  </Link>
)

const UserAvatar: FunctionComponent<{sessionData?: UserSessionData; onClick: (e: React.MouseEvent) => void} & SxProps> =
  React.memo(({sessionData, onClick, ...otherSxProps}) => {
    const initials = React.useMemo(() => {
      if (!sessionData) {
        return '?'
      }
      let initial = sessionData.username?.substring(0, 1)
      if (sessionData.firstName) {
        initial = `${sessionData.firstName.substring(0, 1)}${sessionData.lastName?.substring(0, 1)}`
      }
      return initial?.toUpperCase() || '?'
    }, [sessionData])
    return (
      <Avatar
        sx={{
          bgcolor: '#EDEEF2',
          color: theme.palette.accent.purple,
          cursor: 'pointer',
          ...otherSxProps,
        }}
        onClick={onClick}>
        {initials}
      </Avatar>
    )
  })

const MenuLinksRhs: FunctionComponent<
  AppTopNavProps & {
    isRightHandSide?: boolean
    setIsMobileOpen: Function
    isDrawerLink?: boolean
  }
> = ({routes, sessionData, children, setIsMobileOpen}) => {
  let links: React.ReactNode[] = routes.map(route => {
    return (
      <StyledToolBarLink
        to={route.path}
        key={`rhs_${route.name}`}
        activeStyle={{
          fontWeight: 800,
          color: theme.palette.primary.main,
        }}
        onClick={() => setIsMobileOpen(false)}>
        {route.name}
      </StyledToolBarLink>
    )
  })
  if (Array.isArray(children)) {
    if (sessionData?.token) {
      links.push(children[0])
    } else {
      links.push(children[1])
    }
  }

  return <>{links}</>
}

const AppTopNav: FunctionComponent<AppTopNavProps> = ({
  routes,
  appId,
  sessionData,
  hasSubNav,
  children,
  ...props
}: AppTopNavProps) => {
  const location = useLocation()

  const [isMobileOpen, setIsMobileOpen] = React.useState(false)
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null)
  const toggle = useFeatureToggles<FeatureToggles>()

  const handleMenuClose = () => {
    setMenuAnchor(null)
  }

  // Hide the app store download page and also the sign in page from the nav.
  routes = routes.filter(
    route => route.name !== 'APP STORE' && route.name !== 'SIGN IN' && (!route.toggle || toggle[route.toggle!] === true)
  )

  const redirectToLoginPage = () => {
    sessionStorage.setItem('location', `${location.pathname}${location.search}`)
    window.location.replace(`${window.location.origin}${constants.publicPaths.SIGN_IN}`)
  }

  const isLoginButtonDisabled = React.useMemo(() => {
    return location.pathname.endsWith(constants.publicPaths.SIGN_IN)
  }, [location])

  return (
    <>
      {/* mobile view */}
      <Hidden lgUp>
        <StyledAppNav hasSubNav={hasSubNav}>
          <Box
            sx={{
              display: 'flex',
              borderBottom: '1px solid #EAECEE',
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            {sessionData?.token ? (
              <NavLink to="/studies">
                <img src={Utility.logoSymbolOnly(appId)} key="Open Bridge" alt="logo" />
              </NavLink>
            ) : (
              <img src={Utility.logoSymbolOnly(appId)} key="Open Bridge" alt="logo" />
            )}
            <IconButton
              color="inherit"
              aria-label="Open drawer"
              edge="end"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              size="large">
              <MenuIcon></MenuIcon>
            </IconButton>
          </Box>
          {children}
        </StyledAppNav>
      </Hidden>
      {/* desktop view */}
      <Hidden lgDown>
        <StyledAppNav hasSubNav={hasSubNav}>
          <Box
            sx={{
              display: 'flex',

              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            {sessionData?.token ? (
              <NavLink to="/studies">
                <img src={Utility.logoWithName(hasSubNav, appId)} key="Open Bridge" alt="logo" />
              </NavLink>
            ) : (
              <img src={Utility.logoWithName(hasSubNav, appId)} key="Open Bridge" alt="logo" />
            )}

            <Box sx={{display: 'flex'}}>
              <StyledToolBar disableGutters hasSubNav={hasSubNav}>
                <MenuLinks
                  appId={appId}
                  routes={routes.filter(route => route.name && !route.isRhs)}
                  setIsMobileOpen={setIsMobileOpen}
                />
              </StyledToolBar>
              <StyledToolBar disableGutters hasSubNav={hasSubNav} sx={{paddingRight: 0}}>
                {!sessionData && (
                  <MenuLinksRhs
                    appId={appId}
                    routes={routes.filter(route => route.name && route.isRhs)}
                    sessionData={sessionData}
                    setIsMobileOpen={setIsMobileOpen}>
                    <></>
                    {window.location.pathname !== '/' && (
                      <div>
                        <Button
                          disabled={isLoginButtonDisabled}
                          variant="text"
                          sx={{fontSize: '15px', lineHeight: '18px', color: '#393434'}}
                          onClick={() => redirectToLoginPage()}>
                          LOG IN
                        </Button>
                      </div>
                    )}
                  </MenuLinksRhs>
                )}
                {sessionData && (
                  <UserAvatar sessionData={sessionData} onClick={event => setMenuAnchor(event.target as HTMLElement)} />
                )}
              </StyledToolBar>
            </Box>
          </Box>
          {children}
        </StyledAppNav>
      </Hidden>
      {/* mobile drawer */}

      <StyledDrawer
        variant="temporary"
        anchor="right"
        open={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}>
        <ClearIcon onClick={() => setIsMobileOpen(false)}></ClearIcon>
        <MenuLinks
          isDrawerLink={true}
          appId={appId}
          routes={routes.filter(route => route.name && !route.isRhs)}
          setIsMobileOpen={setIsMobileOpen}
        />

        <MenuLinksRhs
          appId={appId}
          isDrawerLink={true}
          routes={routes.filter(route => route.name && route.isRhs)}
          sessionData={sessionData}
          isRightHandSide={true}
          setIsMobileOpen={setIsMobileOpen}>
          <Box sx={{alignItems: 'center', cursor: 'pointer', marginTop: theme.spacing(14)}}>
            <Box sx={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
              <UserAvatar sessionData={sessionData} onClick={event => {}} />
              &nbsp;&nbsp;&nbsp;
              <ProfileLink />
            </Box>
            <Box sx={{paddingLeft: theme.spacing(6), marginTop: theme.spacing(3)}}>
              <Logout
                element={<Typography sx={{marginLeft: theme.spacing(1), fontSize: '18px'}}>Log Out</Typography>}
              />
            </Box>
          </Box>

          {window.location.pathname !== '/' && window.location.pathname !== constants.publicPaths.SIGN_IN && (
            <Box sx={{display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: theme.spacing(14)}}>
              <UserAvatar
                sessionData={sessionData}
                onClick={event => setMenuAnchor(event.currentTarget as HTMLElement)}
              />
              <Button
                variant="text"
                disabled={/*isLoginButtonDisabled*/ false}
                sx={{marginLeft: theme.spacing(1)}}
                onClick={() => redirectToLoginPage()}>
                Log in
              </Button>
            </Box>
          )}
        </MenuLinksRhs>
      </StyledDrawer>

      <Menu
        id="logout-menu"
        anchorEl={menuAnchor}
        keepMounted
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          elevation: 0,
          sx: {
            boxShadow: 'none',
          },
        }}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}>
        <MenuItem key={'logout'}>
          <Logout element={<Box sx={{fontSize: '18px'}}>Log out</Box>}></Logout>
        </MenuItem>
        <MenuItem key={'profile'}>
          <ProfileLink />
        </MenuItem>
      </Menu>
    </>
  )
}

export default AppTopNav
