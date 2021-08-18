import {useState} from 'react'
import CONSTANTS from '../types/constants'
import {
  AdminRole,
  Phone,
  Response,
  SignInType,
  StringDictionary,
  UserSessionData,
} from '../types/types'

type RestMethod = 'POST' | 'GET' | 'DELETE'

function makeRequest(
  method: RestMethod = 'POST',
  url: string,
  body: any,
  token?: string
): Promise<any> {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest()
    xhr.open(method, url)
    xhr.onload = function () {
      if ((this.status >= 200 && this.status < 300) || this.status === 412) {
        resolve({status: this.status, response: xhr.response, ok: true})
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText,
          message: JSON.parse(xhr.responseText).message,
        })
      }
    }
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText,
        message: xhr.response,
      })
    }
    //xhr.setRequestHeader('Accept-Language', i18n.language)
    xhr.setRequestHeader('Content-Type', 'application/json')
    if (token) {
      xhr.setRequestHeader('Bridge-Session', token)
    }

    xhr.send(body)
  })
}

const callEndpointXHR = async <T>(
  endpoint: string,
  method: RestMethod = 'POST',
  data: StringDictionary<any>,
  token?: string
): Promise<Response<T>> => {
  let body: string | undefined = JSON.stringify(data)

  if (method === 'GET') {
    const queryString = Object.keys(data)
      .map(key => key + '=' + data[key])
      .join('&')
    endpoint = queryString ? `${endpoint}?${queryString}` : endpoint

    body = undefined
  }
  return makeRequest(method, endpoint, body, token).then(
    ({status, response, ok}) => {
      const result = JSON.parse(response)
      return {status: status, data: result, ok: ok}
    },
    error => {
      throw error
    }
  )
}

const callEndpoint = async <T>(
  endpoint: string,
  method: RestMethod = 'POST',
  data: StringDictionary<any>,
  token?: string,
  isSynapseEndpoint?: boolean
): Promise<Response<T>> => {
  /* 
  Agendel: this is only used for e2e which we are doing doing here
  const ls = window.localStorage
  const isE2E = ls.getItem('crc_e2e')
  */
  const isE2E = false
  let url = isSynapseEndpoint
    ? `${CONSTANTS.constants.SYNAPSE_ENDPOINT}${endpoint}`
    : `${CONSTANTS.constants.ENDPOINT}${endpoint}`
  if (isE2E) {
    return callEndpointXHR(url, method, data, token)
  }
  const headers: HeadersInit = new Headers()
  //headers.set('Accept-Language', i18n.language)
  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Bridge-Session', token)
  }

  const config = {
    method: method, // *GET, POST, PUT, DELETE, etc.
    headers,
    body: JSON.stringify(data),
  } as any

  if (method === 'GET') {
    const queryString = Object.keys(data)
      .map(key => key + '=' + data[key])
      .join('&')
    url = queryString ? `${url}?${queryString}` : url
    delete config.body
  }

  const response = await fetch(url, config)

  const result = await response.json()
  if (!response.ok && response.status !== 412) {
    //alert(JSON.stringify(result, null, 2))
    throw result
  }
  return {status: response.status, data: result, ok: response.ok}
}

const getSession = (): UserSessionData | undefined => {
  const item = sessionStorage.getItem(CONSTANTS.constants.SESSION_NAME) || ''
  try {
    const json = JSON.parse(item)
    return json
  } catch {
    return undefined
  }
}

const clearSession = () => {
  sessionStorage.removeItem(CONSTANTS.constants.SESSION_NAME)
  sessionStorage.clear()
}

const setSession = (data: UserSessionData) => {
  sessionStorage.setItem(CONSTANTS.constants.SESSION_NAME, JSON.stringify(data))
}

const getSearchParams = (search: string): Record<string, string> => {
  const searchParamsProps: any = {}
  // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams -- needs polyfill for ie11
  const searchParams = new URLSearchParams(search)
  searchParams.forEach((value, key) => {
    searchParamsProps[key] = value
  })
  return searchParamsProps
}

const getAppId = () => {
  if (document.location.port === '3001') {
    return CONSTANTS.constants.ARC_APP_ID
  } else {
    return CONSTANTS.constants.MTB_APP_ID
  }
}

// function to use session storage (react hooks)
const useSessionStorage = (
  key: string,
  initialValue: string | undefined
): [string | undefined, (value: string | undefined) => void] => {
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.sessionStorage.getItem(key)
      // Parse stored json or if none return initialValue
      const value = item ? item : initialValue
      if (value) {
        window.sessionStorage.setItem(key, value)
      }
      return value
    } catch (error) {
      // If error also return initialValue
      console.log(error)
      return initialValue
    }
  })
  // persist value to session storage
  const setValue = (value: string | undefined) => {
    try {
      setStoredValue(value)
      if (value) {
        window.sessionStorage.setItem(key, value)
      } else {
        window.sessionStorage.removeItem(key)
      }
    } catch (error) {
      console.log(error)
    }
  }
  return [storedValue, setValue]
}

const getRandomId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const getEnumKeys = <T>(enum1: T): (keyof T)[] =>
  Object.keys(enum1) as (keyof T)[]

const getEnumKeyByEnumValue = (
  myEnum: any,
  enumValue: number | string
): string => {
  let keys = Object.keys(myEnum).filter(x => myEnum[x] == enumValue)
  const result = keys.length > 0 ? keys[0] : ''

  return result
}

const bytesToSize = (bytes: number) => {
  const sizes = ['bytes', 'kb', 'MB', 'GB', 'TB']
  if (bytes === 0) return 'n/a'
  const i = parseInt(
    Math.floor(Math.log(bytes) / Math.log(1024)).toString(),
    10
  )
  if (i === 0) return `${bytes} ${sizes[i]})`
  return `${(bytes / 1024 ** i).toFixed(1)}${sizes[i]}`
}
const randomInteger = (min: number, max: number): number => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

//based on https://gist.github.com/lavoiesl/3223665
// generates external id
const generateNonambiguousCode = (
  length: number,
  mode: 'NUMERIC' | 'ALPHANUMERIC' | 'CONSONANTS' = 'NUMERIC'
): string => {
  let result = ''

  const dictionary = {
    NUMERIC: '0123456789',
    ALPHANUMERIC: '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ',
    CONSONANTS: 'bcdfghjkmnpqrstvwxz',
  }
  const symbols = dictionary[mode]
  const max_offset = symbols.length - 1

  for (let i = 0; i < length; i++) {
    const index = randomInteger(0, max_offset)
    result = result + symbols[index]
  }

  return result
}

const makePhone = (phone: string): Phone => {
  const number = phone?.includes('+1') ? phone : `+1${phone}`
  return {
    number: number,
    regionCode: 'US',
  }
}

const isInvalidPhone = (phone: string): boolean => {
  const phoneRegEx = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/
  return phone.match(phoneRegEx) === null
}

/*
  This function is taken from: https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
*/
const isValidEmail = (email: string) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}

const isInAdminRole = (roles?: AdminRole[]) => {
  const userRoles = roles || getSession()?.roles || []
  return userRoles.includes('org_admin')
}

const isPathAllowed = (studyId: string, path: string) => {
  const userRoles = getSession()?.roles || []
  const pathToCheck = path.replace(':id', studyId)
  const access = {
    org_admin: [CONSTANTS.restrictedPaths.ACCESS_SETTINGS],
    study_designer: [CONSTANTS.restrictedPaths.STUDY_BUILDER],
    study_coordinator: [
      CONSTANTS.restrictedPaths.PARTICIPANT_MANAGER,
      CONSTANTS.restrictedPaths.ADHERENCE_DATA,
      CONSTANTS.restrictedPaths.STUDY_DATA,
    ],
  }
  const allowedPaths: string[] = []
  userRoles.forEach(role => {
    Array.prototype.push.apply(
      allowedPaths,
      (access[role] || []).map(link => link.replace(':id', studyId))
    )
  })
  const hasPath = allowedPaths.find(allowedPath =>
    pathToCheck.includes(allowedPath)
  )
  return !!hasPath
}

const isSignInById = (signIn?: SignInType[]): boolean => {
  return !signIn || !signIn.includes('phone_password')
}

const setBodyClass = (next?: string) => {
  const whiteBgSections = [/*'launch',*/ 'preview']
  const blackBgSections = ['study-live']

  window.document.body.classList.remove('blackBg')

  if (next && whiteBgSections.includes(next)) {
    window.document.body.classList.add('whiteBg')
  } else {
    window.document.body.classList.remove('whiteBg')
  }
  if (next && blackBgSections.includes(next)) {
    window.document.body.classList.add('blackBg')
  }
}

const formatStudyId = (studyId: string) => {
  //AGENDEL: 8/18 we are just showing studyId without a dash
  /*
// Format the studyId to take the form xxx-xxx 
if (studyId.length !== 6) return studyId
  return studyId.substring(0, 3) + '-' + studyId.substring(3)*/
  return studyId
}

const UtilityObject = {
  formatStudyId: formatStudyId,
  setBodyClass: setBodyClass,
  isSignInById: isSignInById,
  isPathAllowed: isPathAllowed,
  isInAdminRole: isInAdminRole,
  isValidEmail: isValidEmail,
  isInvalidPhone: isInvalidPhone,
  makePhone: makePhone,
  generateNonambiguousCode: generateNonambiguousCode,
  randomInteger: randomInteger,
  bytesToSize: bytesToSize,
  getEnumKeyByEnumValue: getEnumKeyByEnumValue,
  getEnumKeys: getEnumKeys,
  getRandomId: getRandomId,
  useSessionStorage: useSessionStorage,
  getAppId: getAppId,
  getSearchParams: getSearchParams,
  setSession: setSession,
  clearSession: clearSession,
  getSession: getSession,
  callEndpoint: callEndpoint,
  callEndpointXHR: callEndpointXHR,
}

export default UtilityObject
