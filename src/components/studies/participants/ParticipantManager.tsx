import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Switch,
  MenuItem,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import DeleteIcon from '@material-ui/icons/Delete'
import React, { FunctionComponent } from 'react'
import { useErrorHandler } from 'react-error-boundary'
import { RouteComponentProps } from 'react-router-dom'
import { useAsync } from '../../../helpers/AsyncHook'
import { useUserSessionDataState } from '../../../helpers/AuthContext'
import {
  StudyInfoData,
  useStudyInfoDataDispatch,
  useStudyInfoDataState,
} from '../../../helpers/StudyInfoContext'
import ParticipantService from '../../../services/participants.service'
import StudyService from '../../../services/study.service'
import {
  EnrollmentType,
  ParticipantAccountSummary,
  StringDictionary,
} from '../../../types/types'
import CollapsibleLayout from '../../widgets/CollapsibleLayout'
import HideWhen from '../../widgets/HideWhen'
import AddByIdDialog from './AddByIdDialog'
import AddParticipants from './AddParticipants'
import EnrollmentSelector from './EnrollmentSelector'
import ParticipantTableGrid from './ParticipantTableGrid'
import LinkIcon from '../../../assets/link_icon.svg'
import FlagIcon from '../../../assets/flag_icon.svg'
import SearchIcon from '../../../assets/search_icon.svg'
import {
  ButtonWithSelectSelect,
  ButtonWithSelectButton,
} from '../../widgets/StyledComponents'
import WhiteSearchIcon from '../../../assets/white_search_icon.svg'
import BlackXIcon from '../../../assets/black_x_icon.svg'

const useStyles = makeStyles(theme => ({
  root: {},
  switchRoot: {
    //padding: '8px'
  },
  studyText: {
    fontFamily: 'Lato',
    fontWeight: 'lighter',
  },
  topButtons: {
    marginRight: theme.spacing(2),
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '36px',
  },
  topRow: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: '40px',
  },
  horizontalGroup: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  topButtonContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginLeft: '40px',
  },
  buttonImage: {
    marginRight: '5px',
  },
  participantIDSearchBar: {
    backgroundColor: 'white',
    outline: 'none',
    height: '38px',
    width: '220px',
    borderTopRightRadius: '0px',
    borderBottomRightRadius: '0px',
    padding: '6px',
    borderTop: '1px solid black',
    borderBottom: '1px solid black',
    borderLeft: '1px solid black',
    borderRight: '0px',
    fontSize: '13px',
  },
  searchIconContainer: {
    width: '42px',
    height: '38px',
    backgroundColor: 'black',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '&:hover': {
      backgroundColor: 'black',
      boxShadow: '1px 1px 1px rgb(0, 0, 0, 0.75)',
    },
    borderRadius: '0px',
    minWidth: '0px',
  },
  blackXIcon: {
    marginLeft: '195px',
    position: 'absolute',
    minWidth: '0px',
    width: '18px',
    height: '18px',
    minHeight: '8px',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '15px',
    '&:hover': {
      backgroundColor: 'rgb(0, 0, 0, 0.2)',
    },
    display: 'flex',
  },
}))

type ParticipantManagerOwnProps = {
  title?: string
  paragraph?: string
  studyId?: string
}

const participantRecordTemplate: ParticipantAccountSummary = {
  status: 'unverified',
  isSelected: false,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  id: '',
  externalIds: {},
}

type ParticipantManagerProps = ParticipantManagerOwnProps & RouteComponentProps

type ParticipantData = {
  items: ParticipantAccountSummary[]
  total: number
}

const ParticipantManager: FunctionComponent<ParticipantManagerProps> = () => {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(50)
  const [participantData, setParticipantData] = React.useState<
    ParticipantAccountSummary[] | null
  >(null)
  const [totalParticipants, setTotalParticipants] = React.useState(0)
  const [isSearchingUsingId, setIsSearchingUsingID] = React.useState(false)

  const inputComponent = React.useRef<HTMLInputElement>(null)

  const handleError = useErrorHandler()
  const classes = useStyles()

  const [isEdit, setIsEdit] = React.useState(true)
  const [
    refreshParticipantsToggle,
    setRefreshParticipantsToggle,
  ] = React.useState(false)
  //used with generate id enrollbyId
  const [isGenerateIds, setIsGenerateIds] = React.useState(false)

  const { study }: StudyInfoData = useStudyInfoDataState()
  const studyDataUpdateFn = useStudyInfoDataDispatch()

  const { token } = useUserSessionDataState()

  const { data, status, error, run, setData } = useAsync<ParticipantData>({
    status: 'PENDING',
    data: null,
  })

  React.useEffect(() => {
    const dataRetrieved = data ? data.items : null
    const total = data ? data.total : 0
    setParticipantData(dataRetrieved)
    setTotalParticipants(total)
  }, [data])

  const [exportData, setExportData] = React.useState<any[] | null>(null)
  const [
    isSearchingForParticipant,
    setIsSearchingForParticipant,
  ] = React.useState(false)

  const updateEnrollment = async (type: EnrollmentType) => {
    study.options = { ...study.options, enrollmentType: type }

    const updatedStudy = await StudyService.updateStudy(study, token!)
    studyDataUpdateFn({ type: 'SET_STUDY', payload: { study: study } })
  }

  React.useEffect(() => {
    if (!participantData) {
      return
    }
    const result = participantData.map(record => {
      return {
        healthCode: record.id,
        clinicVisit: '2/14/2020',
        status: record.status,
        referenceId: record.studyExternalId,
        notes: '--',
      }
    })
    setExportData(result)
  }, [participantData])

  async function getParticipants(
    studyId: string,
    token: string,
  ): Promise<ParticipantAccountSummary[]> {
    const clinicVisitMap: StringDictionary<string> = await ParticipantService.getClinicVisitsForParticipants(
      studyId,
      token,
      participantData!.map(p => p.id),
    )
    const result = participantData!.map(participant => {
      const id = participant.id as string
      const visit = clinicVisitMap[id]
      const y = { ...participant, clinicVisit: visit }
      return y
    })

    return result
  }

  React.useEffect(() => {
    if (!study?.identifier) {
      return
    }
    handleResetSearch(false)
  }, [run, currentPage, pageSize])

  const handleSearchParticipantRequest = async () => {
    const searchedValue = inputComponent.current?.value
      ? inputComponent.current?.value
      : ''
    const result = await ParticipantService.getParticipantWithId(
      'mtb-user-testing',
      token!,
      searchedValue,
    )
    const realResult = result ? [result] : null
    const totalParticipantsFound = result ? 1 : 0
    setParticipantData(realResult)
    setTotalParticipants(totalParticipantsFound)
    setIsSearchingUsingID(true)
  }

  const handleResetSearch = async (fromXIconPressed: boolean) => {
    const offset = (currentPage - 1) * pageSize
    run(
      ParticipantService.getParticipants(
        'mtb-user-testing',
        token!,
        pageSize,
        offset,
      ),
    )
    if (fromXIconPressed) setIsSearchingUsingID(false)
  }

  if (!study) {
    return <>loading component here</>
  } else if (status === 'REJECTED') {
    handleError(error!)
  } /* if (status === 'RESOLVED') */ else {
    return (
      <>
        <Box px={3} py={2}>
          Study ID: {study.identifier}
        </Box>
        {!study.options?.enrollmentType && (
          <EnrollmentSelector
            callbackFn={(type: EnrollmentType) => updateEnrollment(type)}
          ></EnrollmentSelector>
        )}
        {study.options?.enrollmentType && (
          <>
            {study.options.enrollmentType}
            <Box px={3} py={2}>
              <Grid
                component="label"
                container
                alignItems="center"
                spacing={0}
                className={classes.topRow}
              >
                <div className={classes.horizontalGroup}>
                  <Grid item>View</Grid>
                  <Grid item>
                    <Switch
                      checked={isEdit}
                      classes={{ root: classes.switchRoot }}
                      onChange={e => setIsEdit(e.target.checked)}
                      name="viewEdit"
                    />
                  </Grid>
                  <Grid item>Edit</Grid>
                </div>
                <div className={classes.horizontalGroup}>
                  <ButtonWithSelectSelect
                    key="session_select"
                    value="selectedSessionId"
                    displayEmpty
                    inputProps={{ 'aria-label': 'Without label' }}
                    disableUnderline={true}
                  >
                    <MenuItem value={'placeholder'} key={'hello'}>
                      {'placeholder'}
                    </MenuItem>
                  </ButtonWithSelectSelect>
                  <ButtonWithSelectButton
                    key="duplicate_session"
                    variant="contained"
                    style={{ marginBottom: '0px' }}
                  >
                    Download
                  </ButtonWithSelectButton>
                </div>
              </Grid>
              <Box className={classes.topButtonContainer}>
                {!isEdit && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Button className={classes.topButtons}>
                      <img src={LinkIcon} className={classes.buttonImage}></img>
                      App Download Link
                    </Button>
                  </div>
                )}
                {isSearchingForParticipant ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <input
                      placeholder="Participant IDs"
                      className={classes.participantIDSearchBar}
                      ref={inputComponent}
                      style={{
                        paddingRight: isSearchingUsingId ? '28px' : '4px',
                      }}
                    ></input>
                    {isSearchingUsingId && (
                      <Button
                        className={classes.blackXIcon}
                        onClick={() => handleResetSearch(true)}
                      >
                        <img
                          src={BlackXIcon}
                          style={{
                            width: '10px',
                            height: '10px',
                          }}
                        ></img>
                      </Button>
                    )}
                    <Button
                      className={classes.searchIconContainer}
                      onClick={handleSearchParticipantRequest}
                    >
                      <img src={WhiteSearchIcon}></img>
                    </Button>
                  </div>
                ) : (
                  <Button
                    className={classes.topButtons}
                    onClick={() => {
                      setIsSearchingForParticipant(true)
                    }}
                  >
                    <img src={SearchIcon} className={classes.buttonImage}></img>
                    Find Participant
                  </Button>
                )}
              </Box>
            </Box>
            <CollapsibleLayout
              expandedWidth={300}
              isFullWidth={true}
              isHideContentOnClose={true}
            >
              <>
                {!isGenerateIds && (
                  <AddParticipants
                    study={study}
                    token={token!}
                    enrollmentType={study.options!.enrollmentType /*'PHONE'*/}
                    onAdded={() => {
                      setRefreshParticipantsToggle(prev => !prev)
                    }}
                  ></AddParticipants>
                )}
                {study.options!.enrollmentType === 'ID' && false && (
                  <AddByIdDialog
                    study={study}
                    token={token!}
                    onAdded={(isHideAdd: boolean) => {
                      setRefreshParticipantsToggle(prev => !prev)
                      setIsGenerateIds(true)
                    }}
                  ></AddByIdDialog>
                )}
              </>
              <Box py={0} pr={3} pl={2}>
                {status === 'PENDING' && <CircularProgress></CircularProgress>}
                {status === 'RESOLVED' && (
                  <ParticipantTableGrid
                    rows={participantData || []}
                    studyId={'mtb-user-testing'}
                    totalParticipants={totalParticipants}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    pageSize={pageSize}
                    setPageSize={setPageSize}
                  ></ParticipantTableGrid>
                )}
              </Box>

              <Box textAlign="center" pl={2}>
                ADD A PARTICIPANT
              </Box>
            </CollapsibleLayout>
          </>
        )}
      </>
    )
  }
  return <>bye</>
}
export default ParticipantManager
