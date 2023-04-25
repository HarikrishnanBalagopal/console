import { combineReducers } from 'redux';
import cloudShellReducer from './reducers/cloud-shell-reducer';
import { cloudShellReducerName } from './reducers/cloud-shell-selectors';
import assistantReducer from './reducers/assistant-reducer';
import { assistantReducerName } from './reducers/assistant-selectors';

export default combineReducers({
  [cloudShellReducerName]: cloudShellReducer,
  [assistantReducerName]: assistantReducer,
});
