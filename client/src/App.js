import React, { Component } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Axios from 'axios';
import Cookies from 'universal-cookie';
import Home from './pages/Home';
import Search from './pages/Search';
import Favorites from './pages/Favorites';
import Login from './pages/Login';
import Register from './pages/Register';
import Header from './components/header';
import styles from './styles/App.module.css';
import qs from 'qs';

class App extends Component {
  constructor(props) {
    const cookies = new Cookies();
    super(props);
    this.state = {
      loginId: null,
      showHeader: true
    }
    this.setLoginId = this.setLoginId.bind(this);
    this.showHeader = this.showHeader.bind(this);
    
    var token = cookies.get('token');
    if (!token) {
      Axios.post('/api/newtoken').then(res => {
        this.setCookie(res.headers['x-auth-token']);
      })
    } else {
      Axios.post('/api/getlogin',
        qs.stringify({}),
        {
          headers: {'x-access-token': token}
        }).then(res => {
          if (res.data.loginId) this.setState({loginId: res.data.loginId});
        })
    }
  }

  setCookie(token) {
    const cookies = new Cookies();
    cookies.set('token', token, {expires: new Date(Date.now() + 30*24*60*60*1000)});
  }

  setLoginId(loginId, token) {
    this.setCookie(token);
    this.setState({loginId: loginId});
  }

  showHeader(show) {
    this.setState({showHeader: show});
  }

  render() {
    return (
      <div className={styles.App}>
        <Router>
          <Header loginId={this.state.loginId} setLoginId={this.setLoginId} visible={this.state.showHeader} />
          <Switch>
            <Route exact path='/' component={Home} />
            <Route path='/search' component={Search} />
            <Route path='/favorites' render={(props) =>
              <Favorites loginId={this.state.loginId} />} />
            <Route path='/about' component={Home} />
            <Route path='/login' render={(props) => 
              <Login setLoginId={this.setLoginId} loginId={this.state.loginId} />} />
            <Route path='/register' render={(props) => 
              <Register setLoginId={this.setLoginId} loginId={this.state.loginId} />} />
          </Switch>
        </Router>
      </div>
    );
  }
}

export default App;