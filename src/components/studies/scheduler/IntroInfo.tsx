import {
  Box,
  Button,
  Container,
  createStyles,
  Divider,
  FormControlLabel,
  Theme
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import React from 'react'
import { poppinsFont } from '../../../style/theme'
import { DWsEnum, StartEventId } from '../../../types/scheduling'
import { SimpleTextInput } from '../../widgets/StyledComponents'
import Duration from './Duration'
import StudyStartDate from './StudyStartDate'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    labelDuration: {

      fontFamily: poppinsFont,
      fontSize: '18px',
      fontWeight: 600,

      textAlign: 'left',

    },
    container: {
      backgroundColor: '#FAFAFA',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      padding: theme.spacing(3.75),
      minWidth: '600px',
    },
    formControl: {
      fontSize: '18px',
      width: '100%',
      display: 'flex',
      flexDirection: 'row-reverse',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    divider: {
      width: '100%',
      marginTop: theme.spacing(5),
      marginBottom: theme.spacing(3.75),
    },
    headerText: {
      fontSize: '18px',
      fontFamily: 'Poppins',
      lineHeight: '27px',
    },
    description: {
      fontFamily: 'Lato',
      fontStyle: 'italic',
      fontSize: '15px',
      fontWeight: 'lighter',
      lineHeight: '18px',
    },
  }),
)

export interface IntroInfoProps {
  onContinue: Function
}

const IntroInfo: React.FunctionComponent<IntroInfoProps> = ({
  onContinue,
}: IntroInfoProps) => {
  const classes = useStyles()
  const [studyName, setStudyName] = React.useState<any>('')
  const [duration, setDuration] = React.useState<any>('')
  const [startEventId, setstartEventId] = React.useState<
    StartEventId | undefined
  >(undefined)

  return (
    <Container maxWidth="sm" className={classes.container}>
      <FormControlLabel
      style={{marginBottom: '35px'}}
        classes={{ labelPlacementStart: classes.labelDuration }}
        label={
          <Box width="210px" marginRight="40px">
            <strong className={classes.headerText}>Study Name</strong>
            <br /> <br />
            <div className={classes.description}>
              This name will be displayed to your participants in the app.
            </div>{' '}
          </Box>
        }
        className={classes.formControl}
        labelPlacement="start"
        control={<SimpleTextInput fullWidth onChange={e=> setStudyName(e.target.value)} style={{marginBottom: 0}}/>}
      />
      <FormControlLabel
        classes={{labelPlacementStart: classes.labelDuration  }}
        style={{ /*justifyContent: 'space-between'*/ }}
        label={
          <Box width="210px" marginRight="40px">
            <strong className={classes.headerText}>
              How long will the study run for?
            </strong>
            <br /> <br />
            <div className={classes.description}>
              This is the date the study will permanently close. Make sure to
              add any extra buffer days you might need should the study go
              longer.
            </div>{' '}
          </Box>
        }
        className={classes.formControl}
        labelPlacement="start"
        control={
          <Duration
            onChange={e => setDuration(e.target.value)}
            durationString={duration || ''}
            unitLabel="study duration unit"
            numberLabel="study duration number"
            unitData={DWsEnum}
            isIntro={true}
          ></Duration>
        }
      />
      <Divider className={classes.divider}></Divider>

      <StudyStartDate
        isIntro={true}
        onChange={(pseudonym: StartEventId) => setstartEventId(pseudonym)}
        style={{
          width: '100%',
        }}
      >
        <Box width="210px" marginRight="40px">
          <strong className={classes.headerText}>
            How would you define Day 1 of your study ?
          </strong>
          <br /> <br />
          <div className={classes.description}>
            Day 1 is when you want your participants to start taking the remote
            assessments.
          </div>
        </Box>
      </StudyStartDate>
      <Button
        variant="contained"
        color="primary"
        key="saveButton"
        onClick={e => onContinue(studyName, duration, startEventId)}
        disabled={!(duration && startEventId && studyName)}
        style={{ marginTop: '24px' }}
      >
        Continue
      </Button>
    </Container>
  )
}

export default IntroInfo
