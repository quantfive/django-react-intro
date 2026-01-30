import React, { Component } from 'react';
import { StyleSheet, css } from 'aphrodite';
import posthog from '../../utils/posthog';

class Analytics extends Component {
  constructor(props) {
    super(props);
    this.state = {
      yesterdayVisitors: null,
      loading: true,
      error: null,
      yesterdayDate: null
    };
  }

  componentDidMount() {
    this.fetchYesterdayVisitors();
  }

  async fetchYesterdayVisitors() {
    try {
      // Calculate yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      this.setState({ yesterdayDate: yesterdayStr });

      // Get PostHog API key from the initialized instance
      const apiKey = process.env.REACT_APP_POSTHOG_KEY;
      const projectId = process.env.REACT_APP_POSTHOG_PROJECT_ID;

      if (!apiKey || apiKey === 'phc_YOUR_PROJECT_API_KEY') {
        this.setState({
          loading: false,
          error: 'PostHog is not configured. Please set REACT_APP_POSTHOG_KEY in your environment.'
        });
        return;
      }

      if (!projectId) {
        this.setState({
          loading: false,
          error: 'PostHog project ID is not configured. Please set REACT_APP_POSTHOG_PROJECT_ID in your environment.'
        });
        return;
      }

      // Query PostHog API for yesterday's unique visitors
      const response = await fetch(
        `https://app.posthog.com/api/projects/${projectId}/insights/trend/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            events: [{ id: '$pageview', type: 'events' }],
            properties: [],
            date_from: yesterdayStr,
            date_to: yesterdayStr,
            interval: 'day',
            display: 'ActionsLineGraph',
            insight: 'TRENDS'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      // Extract unique visitor count
      const count = data.result?.[0]?.count || 0;

      this.setState({
        yesterdayVisitors: count,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching PostHog data:', error);
      this.setState({
        loading: false,
        error: error.message
      });
    }
  }

  render() {
    const { yesterdayVisitors, loading, error, yesterdayDate } = this.state;

    return (
      <div className={css(styles.container)}>
        <div className={css(styles.card)}>
          <h1 className={css(styles.title)}>Visitor Analytics</h1>

          {loading && (
            <div className={css(styles.loading)}>
              <p>Loading analytics data...</p>
            </div>
          )}

          {error && (
            <div className={css(styles.error)}>
              <h2>Configuration Required</h2>
              <p>{error}</p>
              <div className={css(styles.instructions)}>
                <h3>Setup Instructions:</h3>
                <ol>
                  <li>Sign up for PostHog at <a href="https://posthog.com" target="_blank" rel="noopener noreferrer">posthog.com</a></li>
                  <li>Get your Project API Key from PostHog settings</li>
                  <li>Get your Project ID from your PostHog project URL</li>
                  <li>Create a <code>.env</code> file in the <code>web/</code> directory with:
                    <pre className={css(styles.code)}>
                      REACT_APP_POSTHOG_KEY=your_api_key_here{'\n'}
                      REACT_APP_POSTHOG_PROJECT_ID=your_project_id_here
                    </pre>
                  </li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className={css(styles.stats)}>
              <div className={css(styles.statCard)}>
                <div className={css(styles.statNumber)}>{yesterdayVisitors}</div>
                <div className={css(styles.statLabel)}>Visitors Yesterday</div>
                <div className={css(styles.statDate)}>{yesterdayDate}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    maxWidth: '800px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '30px',
    textAlign: 'center',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '18px',
  },
  error: {
    background: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
    padding: '20px',
    color: '#856404',
  },
  instructions: {
    marginTop: '20px',
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
  },
  code: {
    background: '#282c34',
    color: '#61dafb',
    padding: '15px',
    borderRadius: '4px',
    fontSize: '14px',
    overflow: 'auto',
    marginTop: '10px',
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
  },
  statCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    padding: '40px 60px',
    textAlign: 'center',
    color: 'white',
    minWidth: '300px',
    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
  },
  statNumber: {
    fontSize: '64px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  statLabel: {
    fontSize: '20px',
    opacity: 0.9,
    marginBottom: '10px',
  },
  statDate: {
    fontSize: '14px',
    opacity: 0.7,
  },
});

export default Analytics;
