import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classnames from 'classnames';
import Select from 'react-select';
import { Actions as KafkaActions } from 'redux-lenses-streaming';
import { Action } from '../actions';


class Subscribe extends React.Component {
  constructor(props) {
    super(props);

    this.onSqlsChange = this.onSqlsChange.bind(this);
    this.onSubscribe = this.onSubscribe.bind(this);
    this.onUnsubscribe = this.onUnsubscribe.bind(this);
    this.onClearMessages = this.onClearMessages.bind(this);
    this.onSensorSelected = this.onSensorSelected.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);

    this.state = {
      onlyFuture: false,
      sqls: 'SELECT * FROM sensor_data_avg WHERE _ktype=STRING and _vtype=AVRO',
    };

  }

  onSqlsChange(event) {
    this.setState({ sqls: event.target.value });
  }

  onSubscribe() {
    if (this.state.sqls) {

      const sqls = this.state.onlyFuture
        ? (this.state.sqls + ' AND _ts > ' + (new Date()).getTime())
        : this.state.sqls;
      const request = {
        sqls,
      };
      this.props.subscribe(request);
    }
  }

  onClearMessages() {
    this.props.clearMessages();
  }

  onSensorSelected(sensor) {
    this.props.updateSelectedSensor(sensor && sensor.value);
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  onUnsubscribe(topic) {
    const request = {
      topics: [topic],
    };
    this.props.unsubscribe(request);
  }

  render() {
    const { messages, subscriptions, connection, selectedSensor, selectedMessages } = this.props;
    const { sqls, onlyFuture } = this.state;

    const btnStyle = classnames('button is-small is-info');

    const topics = subscriptions.map(subscription =>
      (<button
        onClick={this.onUnsubscribe.bind(this, subscription)}
        key={subscription}
        className="button is-danger is-outlined is-small is-pulled-right"
      >
        <span>{subscription}</span>
        <span className="icon is-small">
          <i className="fa fa-times" />
        </span>
      </button>));

    const sensorKeys = Object.keys(messages);
    const sensors = sensorKeys && sensorKeys.length ?
      <Select
        name="sensorSelect"
        className="select is-primary is-small is-pulled-right sensor-select"
        placeholder="Sensor"
        value={selectedSensor}
        onChange={this.onSensorSelected}
        options={sensorKeys.map((sensor) => ({ value: sensor, label: sensor }))}
        clearable={false}
      /> :
      <div></div>

    return (
      <nav className="ws-subscribe panel">
        <div className="panel-heading">
          <div className="field has-addons">
            <p className="control is-expanded">
              <textarea
                rows="3"
                className="textarea is-small is-info"
                placeholder="SQLS"
                value={sqls}
                onChange={this.onSqlsChange}
              />
            </p>
          </div>
        </div>
        <div className="panel-block">
          <div className="control">
            <button
              style={{ marginRight: '10px' }}
              onClick={this.onSubscribe}
              className={btnStyle}
              disabled={!connection || !this.state.sqls}
            >
              Subscribe
           </button>
            <button
              onClick={this.onClearMessages}
              className="button is-small is-danger"
              disabled={!connection}
            >
              Clear Messages
            </button>
          </div>
          <div className="control">
            <label className="checkbox">
              <input type="checkbox"
                name="onlyFuture"
                checked={onlyFuture}
                onChange={this.handleInputChange} />
              Message Time > Now
            </label>
          </div>
          <div className="control">
            {sensors}
          </div>
          <div className="control">
            {topics}
          </div>
        </div>
        <div className="panel-block">
          <div className="control">
            Number of messages: {(selectedMessages && selectedMessages.length) || 0}
          </div>
        </div>
      </nav>
    );
  }
}

Subscribe.defaultProps = {
};

Subscribe.propTypes = {
  subscribe: PropTypes.func.isRequired,
  unsubscribe: PropTypes.func.isRequired,
  selectedMessages: PropTypes.array.isRequired,
  updateSelectedSensor: PropTypes.func.isRequired,
  selectedSensor: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  subscriptions: state.lenses.subscriptions,
  connection: state.lenses.connection,
});

const mapDispatchToProps = dispatch => ({
  subscribe: (message) => {
    dispatch(KafkaActions.subscribe(message));
  },
  unsubscribe: (message) => {
    dispatch(KafkaActions.unsubscribe(message));
  },
  updateSelectedSensor: (sensor) => {
    dispatch(Action.updateSelectedSensor(sensor));
  },
  clearMessages: (message) => {
    dispatch(Action.clearMessages());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(Subscribe);

