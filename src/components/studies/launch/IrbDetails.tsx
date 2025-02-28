import Alert_Icon from '@assets/alert_icon.svg'
import {ReactComponent as ArrowIcon} from '@assets/arrow_long.svg'
import {ReactComponent as EnvelopeImg} from '@assets/launch/envelope_icon.svg'
import DatePicker from '@components/widgets/DatePicker'
import {MTBHeadingH1, MTBHeadingH2} from '@components/widgets/Headings'
import {AlertWithText, SimpleTextInput, SimpleTextLabel} from '@components/widgets/StyledComponents'
import {useUserSessionDataState} from '@helpers/AuthContext'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  Radio,
  RadioGroup,
} from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import StudyService from '@services/study.service'
import {theme, ThemeType} from '@style/theme'
import constants from '@typedefs/constants'
import {Contact, Study} from '@typedefs/types'
import dayjs from 'dayjs'
import React, {useEffect} from 'react'
import {NavLink, Redirect} from 'react-router-dom'
import LeadInvestigatorDropdown from '../app-design/LeadInvestigatorDropdown'

const useStyles = makeStyles((theme: ThemeType) => ({
  root: {
    padding: theme.spacing(3),
  },
  continueButton: {
    // display: 'block',
    marginTop: theme.spacing(7),
    '& svg': {
      marginLeft: theme.spacing(2),
      transform: 'scaleX(-1)',
      '& path': {
        fill: '#fcfcfc',
      },
    },
  },
  input: {
    height: '44px',
  },
  alertText: {
    fontSize: '18px',
    backgroundColor: 'transparent',
    color: 'black',
    lineHeight: '27px',
  },
  dateValidationErrorText: {
    color: theme.palette.error.main,
    fontSize: '13px',
  },
}))

export interface IrbDetailsProps {
  study: Study
  isFinished: boolean
  onEnableNext: Function
  onChange: Function
  onShowFeedback: Function
}

const LastScreen: React.FunctionComponent<{
  study: Study
  onShowFeedback: Function
}> = ({study, onShowFeedback}) => {
  const classes = useStyles()
  const {token} = useUserSessionDataState()
  const [isLaunching, setIsLaunching] = React.useState(false)
  const [isLaunched, setIsLaunched] = React.useState(false)

  if (isLaunched) {
    return <Redirect to={`/studies/${study.identifier}/study-live`} />
  }
  const launchStudy = async () => {
    setIsLaunching(true)
    try {
      await StudyService.launchStudy(study.identifier, token!)
      setIsLaunched(true)
    } catch (error) {
      onShowFeedback(error)
    } finally {
      setIsLaunching(false)
    }
  }
  return (
    <Box textAlign="center">
      <EnvelopeImg />
      <MTBHeadingH1 style={{margin: '24px 0', textDecoration: 'underline'}}> Almost there! </MTBHeadingH1>
      <p>
        Please email a copy of your IRB <br />
        Approval/Exempt letter to:
      </p>
      <p>
        <a href="mailto:ACT@synapse.org">ACT@synapse.org</a>
      </p>
      {isLaunching ? (
        <CircularProgress color="primary" />
      ) : (
        <Button onClick={launchStudy} variant="contained" className={classes.continueButton} color="primary">
          Continue <ArrowIcon />
        </Button>
      )}
    </Box>
  )
}

export const getDateWithTimeZone = (date: Date) => {
  // code from: https://stackoverflow.com/questions/7556591/is-the-javascript-date-object-always-one-day-off
  return new Date(date.getTime() - date.getTimezoneOffset() * -60000)
}

export const getFormattedDate = (date: Date | null) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : ''
}

type ContactRoleTypes = 'irb' | 'principal_investigator' | 'study_support' | 'sponsor'

const IrbDetails: React.FunctionComponent<IrbDetailsProps> = ({
  study,
  isFinished,
  onEnableNext,
  onChange,
  onShowFeedback,
}: IrbDetailsProps) => {
  const inputStyles = {
    width: '100%',
  } as React.CSSProperties

  const classes = useStyles()
  const {token, orgMembership} = useUserSessionDataState()
  const [irbRecordSameInstAffiliation, setIrbRecordSameInstAffiliation] = React.useState<boolean>(false)
  const [certifyStatements, setCertifyStatement] = React.useState({
    isStudyProtocolReviewed: false,
    isStudyConsistentWithLaws: false,
  })

  useEffect(() => {
    const institutionalAffiliation = getContactObject('principal_investigator')!.affiliation
    const nameOfIrbRecord = getContactObject('irb')!.name
    const irbRecordSameInstitutionalAffiliation = nameOfIrbRecord === institutionalAffiliation
    setIrbRecordSameInstAffiliation(irbRecordSameInstitutionalAffiliation)
  }, [])

  useEffect(() => {
    const certified = certifyStatements.isStudyProtocolReviewed && certifyStatements.isStudyConsistentWithLaws
    if (!certified) {
      onEnableNext(false)
      return
    }
  }, [certifyStatements])

  useEffect(() => {
    if (study.irbDecisionType === 'approved' || !study.irbDecisionType) {
      const approvalDate = study.irbDecisionOn
      const approvedUntil = study.irbExpiresOn
      const isCorrectFormat = approvalDate && approvedUntil && approvedUntil >= approvalDate
      if (!isCorrectFormat) {
        onEnableNext(false)
        return
      }
    } else {
      const exemptDate = study.irbDecisionOn
      if (!exemptDate) {
        onEnableNext(false)
        return
      }
    }
    const investigator = getContactObject('principal_investigator')!
    const irb = getContactObject('irb')!
    const inputFieldsCorrectFormat = investigator.affiliation && study.irbProtocolId && irb.name && study.irbName
    onEnableNext(inputFieldsCorrectFormat)
  })

  const getContactObject = (role: ContactRoleTypes) => {
    return study?.contacts?.find(el => el.role === role)
  }

  const updateContactsArray = (role: ContactRoleTypes, newContactObject: Contact, currentContactsArray: Contact[]) => {
    const contactIndex = currentContactsArray.findIndex(el => el.role === role)
    const newContactsArray = [...currentContactsArray]
    newContactsArray[contactIndex] = newContactObject
    return newContactsArray
  }

  const displayApprovalDateError = study.irbDecisionOn && study.irbExpiresOn && study.irbDecisionOn > study.irbExpiresOn
  const irbDecisionIsApproved = !study.irbDecisionType || study.irbDecisionType === 'approved'
  const irbDecisionDate = study.irbDecisionOn ? getDateWithTimeZone(new Date(study.irbDecisionOn)) : null
  const irbExpirationDate = study.irbExpiresOn ? getDateWithTimeZone(new Date(study.irbExpiresOn)) : null
  return (
    <>
      {!isFinished && (
        <Box textAlign="left">
          <MTBHeadingH2>IRB Details &amp; Certification</MTBHeadingH2>
          <Box mt={2} mb={2} fontSize="16px" fontFamily="Lato">
            I certify that
          </Box>
          <Box pl={3} mb={4}>
            <FormControlLabel
              key="confirmReviewed"
              control={
                <Checkbox
                  checked={certifyStatements.isStudyProtocolReviewed}
                  onChange={event => {
                    setCertifyStatement(prevState => {
                      return {
                        ...prevState,
                        isStudyProtocolReviewed: !prevState.isStudyProtocolReviewed,
                      }
                    })
                  }}
                  name="confirmReviewed"
                  color="primary"
                />
              }
              label="The study protocol was reviewed by the IRB and /or equivalent body listed below."
            />
            <FormControlLabel
              key="confirmConsistent"
              control={
                <Checkbox
                  checked={certifyStatements.isStudyConsistentWithLaws}
                  onChange={event => {
                    setCertifyStatement(prevState => {
                      return {
                        ...prevState,
                        isStudyConsistentWithLaws: !prevState.isStudyConsistentWithLaws,
                      }
                    })
                  }}
                  name="confirmReviewed"
                  color="primary"
                />
              }
              label="The Principal Investigator has assured that this study is consistent with applicable laws and regulations as well as relevant institutional policies."
            />
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <SimpleTextLabel htmlFor="protocolTitle">IRB Protocol Title*</SimpleTextLabel>
                <SimpleTextInput
                  value={study.irbName || ''}
                  placeholder="Official IRB Protocol Name"
                  onChange={e => {
                    const newStudy = {
                      ...study,
                      irbName: e.target.value,
                    }
                    onChange(newStudy)
                  }}
                  id="protocolTitle"
                  rows={5}
                  className={classes.input}
                  inputProps={{
                    style: inputStyles,
                  }}
                />
              </FormControl>
            </Grid>
            <Grid item xs={6}></Grid>
            <Grid item xs={6}>
              <LeadInvestigatorDropdown
                token={token!}
                orgMembership={orgMembership!}
                currentInvestigatorSelected={getContactObject('principal_investigator')?.name || ''}
                onChange={(name: string) => {
                  const newPrincipleInvestigator = {
                    ...getContactObject('principal_investigator')!,
                  }
                  newPrincipleInvestigator!.name = name
                  const newContactsArray = updateContactsArray(
                    'principal_investigator',
                    newPrincipleInvestigator,
                    study.contacts!
                  )
                  const newStudy: Study = {
                    ...study,
                    contacts: newContactsArray,
                  }
                  onChange(newStudy)
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <Box fontSize="12px" mt={2}>
                Principal Investigators must be listed as the "Study Administrator".
                <br />
                <br />
                If your PI is not listed in the dropdown menu, please add them to the study and/or make them a{' '}
                <strong>Co-Study Administrator</strong>
                &nbsp;via the &nbsp;
                <NavLink
                  to={constants.restrictedPaths.ACCESS_SETTINGS.replace(':id', study.identifier)}
                  key={'path-to-access-settings'}>
                  Access Settings
                </NavLink>
                &nbsp; tab on the top right hand side.
              </Box>
            </Grid>
            <Grid item xs={6} style={{marginTop: '-32px'}}>
              <FormControl fullWidth>
                <SimpleTextLabel htmlFor="affiliation">Institutional Affiliation*</SimpleTextLabel>
                <SimpleTextInput
                  value={getContactObject('principal_investigator')?.affiliation || ''}
                  placeholder="Official IRB Protocol Name"
                  onChange={e => {
                    const newPrincipleInvestigator = {
                      ...getContactObject(`principal_investigator`)!,
                    }
                    newPrincipleInvestigator!.affiliation = e.target.value
                    let newContactsArray = updateContactsArray(
                      'principal_investigator',
                      newPrincipleInvestigator,
                      study.contacts!
                    )
                    if (irbRecordSameInstAffiliation) {
                      const newIrbRecord = {
                        ...getContactObject('irb')!,
                      }
                      newIrbRecord!.name = e.target.value
                      newContactsArray = updateContactsArray('irb', newIrbRecord, newContactsArray)
                    }
                    const newStudy: Study = {
                      ...study,
                      contacts: newContactsArray,
                    }
                    onChange(newStudy)
                  }}
                  id="affiliation"
                  multiline={false}
                  className={classes.input}
                  inputProps={{
                    style: inputStyles,
                  }}
                />
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              &nbsp;
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <SimpleTextLabel sx={{marginBottom: theme.spacing(-1)}}>What is your IRB of record?*</SimpleTextLabel>
                <Box pl={4} mt={2}>
                  <RadioGroup
                    aria-label="irb of record"
                    name="irbOfRecord"
                    value={irbRecordSameInstAffiliation ? 'aff_same' : 'aff_other'}
                    onChange={e => {
                      const isSameAsInstitution = e.target.value === 'aff_same'
                      // let irbRecordName = studyData?.nameOfIrbRecord || ''
                      if (isSameAsInstitution) {
                        const newIrbRecord = {
                          ...getContactObject('irb')!,
                        }
                        newIrbRecord!.name = getContactObject('principal_investigator')?.affiliation || ''
                        const newContactsArray = updateContactsArray('irb', newIrbRecord, study.contacts!)
                        const newStudy: Study = {
                          ...study,
                          contacts: newContactsArray,
                        }
                        onChange(newStudy)
                      }
                      setIrbRecordSameInstAffiliation(isSameAsInstitution)
                    }}>
                    <FormControlLabel
                      control={<Radio color="secondary" />}
                      label="Same Institutional Affiliation"
                      value="aff_same"
                      id="aff_same_irb_record"
                    />
                    <FormControlLabel
                      control={<Radio color="secondary" />}
                      label="Other:"
                      value="aff_other"
                      id="aff_other_irb_record"
                    />
                  </RadioGroup>
                  <SimpleTextInput
                    value={getContactObject('irb')?.name || ''}
                    placeholder="Name IRB of record"
                    onChange={e => {
                      const newIrbRecord = {
                        ...getContactObject('irb')!,
                      }
                      newIrbRecord!.name = e.target.value
                      const newContactsArray = updateContactsArray('irb', newIrbRecord, study.contacts!)
                      const newStudy: Study = {
                        ...study,
                        contacts: newContactsArray,
                      }
                      onChange(newStudy)
                    }}
                    id="irbOfRecord"
                    rows={5}
                    className={classes.input}
                    style={{width: '100%', marginTop: '10px'}}
                    inputProps={{
                      style: inputStyles,
                    }}
                    $readOnly={irbRecordSameInstAffiliation}
                  />
                </Box>
              </FormControl>
            </Grid>
            <Grid item xs={6}></Grid>
            <Grid item xs={6}>
              <FormControl>
                <SimpleTextLabel htmlFor="protocolId">IRB Protocol ID*</SimpleTextLabel>
                <SimpleTextInput
                  value={study?.irbProtocolId || ''}
                  placeholder="Protocol ID"
                  onChange={e => {
                    const newStudy: Study = {
                      ...study,
                      irbProtocolId: e.target.value,
                    }
                    onChange(newStudy)
                  }}
                  id="protocolId"
                  multiline={false}
                  className={classes.input}
                />
              </FormControl>
            </Grid>
            <Grid item xs={6}></Grid>
            <Grid item xs={6}>
              <MTBHeadingH2 style={{fontSize: '16px'}}>IRB Decision*: </MTBHeadingH2>
              <Box pl={3} mt={2}>
                <FormControl>
                  <RadioGroup
                    aria-label="Irb Decision"
                    name="irbDecision"
                    value={irbDecisionIsApproved ? 'irb_approved' : 'irb_exempt'}
                    onChange={e => {
                      const isApproved = e.target.value === 'irb_approved'
                      const newStudy = {...study}
                      newStudy.irbDecisionType = isApproved ? 'approved' : 'exempt'
                      onChange(newStudy)
                    }}>
                    <FormControlLabel control={<Radio />} label="Approved" labelPlacement="end" value="irb_approved" />
                    <Box style={{display: 'flex', flexDirection: 'row'}}>
                      <FormControl style={{marginRight: '8px'}}>
                        <DatePicker
                          label="Date of IRB Approval"
                          id="approvalDate"
                          value={irbDecisionIsApproved ? irbDecisionDate : null}
                          onChange={e => {
                            const updatedStudy = {...study}
                            if (!updatedStudy.irbDecisionType) {
                              updatedStudy.irbDecisionType = 'approved'
                            }
                            updatedStudy.irbDecisionOn = getFormattedDate(e)
                            onChange(updatedStudy)
                          }}
                          disabled={!irbDecisionIsApproved}></DatePicker>
                      </FormControl>
                      <FormControl>
                        <DatePicker
                          label="Date of Approval Expiration"
                          id="expirationDate"
                          value={irbDecisionIsApproved ? irbExpirationDate : null}
                          onChange={e => {
                            const updatedStudy = {...study}
                            if (!updatedStudy.irbDecisionType) {
                              updatedStudy.irbDecisionType = 'approved'
                            }
                            updatedStudy.irbExpiresOn = getFormattedDate(e)
                            onChange(updatedStudy)
                          }}
                          disabled={!irbDecisionIsApproved}></DatePicker>
                      </FormControl>
                    </Box>
                    {displayApprovalDateError && (
                      <FormHelperText
                        id="approval-date-validation-error-text"
                        className={classes.dateValidationErrorText}>
                        Please make sure that expiration date is the same or after approval date.
                      </FormHelperText>
                    )}
                    <FormControlLabel
                      sx={{marginTop: theme.spacing(2)}}
                      control={<Radio />}
                      label="Exempt"
                      value="irb_exempt"
                    />
                    <FormControl>
                      <DatePicker
                        id="exemptionDate"
                        label="Date of Exemption"
                        value={!irbDecisionIsApproved ? irbDecisionDate || null : null}
                        onChange={e => {
                          const updatedStudy = {
                            ...study,
                          }
                          if (!updatedStudy.irbDecisionType) {
                            updatedStudy.irbDecisionType = 'exempt'
                          }
                          if (updatedStudy.irbExpiresOn) {
                            updatedStudy.irbExpiresOn = undefined
                          }
                          updatedStudy.irbDecisionOn = getFormattedDate(e)
                          onChange(updatedStudy)
                        }}
                        disabled={irbDecisionIsApproved}></DatePicker>
                    </FormControl>
                  </RadioGroup>
                </FormControl>
              </Box>
            </Grid>
          </Grid>
          {study.phase === 'in_flight' && (
            <Box mt={2}>
              <AlertWithText
                severity="error"
                icon={<img src={Alert_Icon} style={{height: '30px'}} alt={'study-warning'}></img>}
                className={classes.alertText}>
                Once your study is submitted, everything related to sessions/scheduling/enrollment will be{' '}
                <strong>locked</strong>
                -only <strong>Customize App</strong> and <strong>Study & IRB</strong> details will be{' '}
                <strong>editable.</strong>
              </AlertWithText>
            </Box>
          )}
        </Box>
      )}
      {isFinished && <LastScreen study={study} onShowFeedback={onShowFeedback}></LastScreen>}
    </>
  )
}

export default IrbDetails
