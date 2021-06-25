import {
  Box, Container,
  FormControlLabel,
  makeStyles,
  Switch,
  TextField
} from '@material-ui/core'
import React, { FunctionComponent } from 'react'
import { useUserSessionDataState } from '../../helpers/AuthContext'
import { isInAdminRole } from '../../helpers/utility'
import { latoFont, poppinsFont } from '../../style/theme'
import ErrorDisplay from '../widgets/ErrorDisplay'
import AccessGrid, { Access, getAccessFromRoles } from './AccessGrid'

const useStyles = makeStyles(theme => ({
  root: {},
}))

export type NewOrgAccount = {
  id: string
  access: Access
  email?: string
  principalId?: string
  firstName?: string
  lastName?: string
  isAdded: boolean
  error?: string
}

type MemberInviteProps = {
  index: number
  newOrgAccount: NewOrgAccount
  onUpdate: Function
}

const MemberInvite: FunctionComponent<MemberInviteProps> = ({
  index,
  newOrgAccount,
  onUpdate,
}: MemberInviteProps) => {
  const classes = useStyles()
  const [email, setEmail] = React.useState(newOrgAccount.email)
  const [access, setAccess] = React.useState(newOrgAccount.access)
  const [coadmin, setCoadmin] = React.useState(false)
  const sessionData = useUserSessionDataState()

  const updateCoadmin = (isChecked: boolean) => {
    setCoadmin(isChecked)
    debugger
    if (isChecked) {
      debugger
      setAccess(getAccessFromRoles(['org_admin']))
      onUpdate({...newOrgAccount, access: access})
    }
  }

  return (
    <Container maxWidth="lg" className={classes.root}>
      <Box fontFamily={poppinsFont} fontSize="14px" mb={0.75}>
        Email Address:
      </Box>
      <TextField
        fullWidth
        variant="outlined"
        onChange={e => setEmail(e.target.value)}
        onBlur={e => onUpdate({ ...newOrgAccount, email: email })}
        color="secondary"
        value={email || ''}
        placeholder="email@synapse.org"
        style={{ fontFamily: latoFont }}
      ></TextField>
      {newOrgAccount.error && (
        <ErrorDisplay>{newOrgAccount.error.toString()}</ErrorDisplay>
      )}
      <FormControlLabel
        control={
          <Switch
            checked={coadmin}
            onChange={e => updateCoadmin(e.target.checked)}
            name="isCoadmin"
            color="primary"
          />
        }
        label="MAKE CO-ADMINISTRATOR OF STUDY"
        style={{
          marginBottom: coadmin ? '12px' : '42px',
          marginTop: '8px',
          fontFamily: latoFont,
        }}
      />
      {coadmin && (
        <Box mb={4}>
          Administrators have full access to a study. They can add/delete team
          members.
          <br />
          <br />
          <strong>Principal Investigators</strong> are required to be part of
          the study as a Study Administrator in order to launch a study.
        </Box>
      )}
      <AccessGrid
        access={access}
        onUpdate={(_access: Access) => {
          setAccess({ ..._access })
          setCoadmin(false)
          onUpdate({ ...newOrgAccount, access: _access })
        }}
        isEdit={true}
        isCoadmin={coadmin}
        currentUserIsAdmin={isInAdminRole(sessionData.roles)}
      ></AccessGrid>
    </Container>
  )
}

export default MemberInvite
