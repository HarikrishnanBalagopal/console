import { combineReducers } from 'redux';
import cloudShellReducer from './reducers/cloud-shell-reducer';
import { cloudShellReducerName } from './reducers/cloud-shell-selectors';
import wisdomReducer from './reducers/wisdom-reducer';
import { wisdomReducerName } from './reducers/wisdom-selectors';

export default combineReducers({
  [cloudShellReducerName]: cloudShellReducer,
  [wisdomReducerName]: wisdomReducer,
});
