import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import './App.css';
import SubjectsManagement from './pages/Subjects';
import ClassesManagement from './pages/Classes';

import Main from './Userpages/MainPage';
import MainPage from './Userpages/Main';
import { Upload } from 'lucide-react';
import UploadPage from './Userpages/Upload';
import KeyOCRPage from './Userpages/Key';

// Import the new Navbar component
import Navbar from './Components/Navbar';
import CompactAnalyticsDashboard from './Userpages/Analytics';
import StudentAnalyticsDashboard from './pages/Results';


function App() {
  return (
    <Router>
      <div className="App">
        {/* Add the Navbar component here */}
        <Navbar />
        
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/subjects" component={SubjectsManagement} />
          <Route exact path="/classes" component={ClassesManagement} />
          <Route exact path="/main" component={MainPage} />
          <Route exact path="/upload" component={UploadPage} />
          <Route exact path="/key" component={KeyOCRPage} />
          <Route exact path="/Analytics" component={CompactAnalyticsDashboard} />
          <Route exact path="/results" component={StudentAnalyticsDashboard} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;