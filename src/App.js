import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Container,
  Grid,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
} from 'recharts';

const API_BASE = 'http://20.244.56.144/evaluation-service';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ3MDMxMzEzLCJpYXQiOjE3NDcwMzEwMTMsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImY1NzZjMDk0LTcwNjktNDIyNS1iYjg1LWVmNzgwMWRiNTdjYSIsInN1YiI6InNocmluaXZhc3Nhbm5kLjIyY2RyQGtvbmd1LmVkdSJ9LCJlbWFpbCI6InNocmluaXZhc3Nhbm5kLjIyY2RyQGtvbmd1LmVkdSIsIm5hbWUiOiJzaHJpbml2YXNzYW4gbiBkIiwicm9sbE5vIjoiMjJjZHIwOTQiLCJhY2Nlc3NDb2RlIjoiam1wWmFGIiwiY2xpZW50SUQiOiJmNTc2YzA5NC03MDY5LTQyMjUtYmI4NS1lZjc4MDFkYjU3Y2EiLCJjbGllbnRTZWNyZXQiOiJLUW1LbVVXdUVaZG1IWnNBIn0.gxeH5Oq-XVmLcfq3d6CvfxncPLStNwVa7-PH4Gb2_SY';

// Utility functions for correlation calculation
const calculateMean = (data) => data.reduce((sum, val) => sum + val, 0) / data.length;

const calculateStandardDeviation = (data) => {
  const mean = calculateMean(data);
  const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
  return Math.sqrt(calculateMean(squaredDiffs));
};

const calculateCovariance = (dataX, dataY) => {
  const meanX = calculateMean(dataX);
  const meanY = calculateMean(dataY);
  const products = dataX.map((x, i) => (x - meanX) * (dataY[i] - meanY));
  return calculateMean(products);
};

const calculateCorrelation = (dataX, dataY) => {
  const covariance = calculateCovariance(dataX, dataY);
  const stdX = calculateStandardDeviation(dataX);
  const stdY = calculateStandardDeviation(dataY);
  return covariance / (stdX * stdY);
};

// Stock Page Component
const StockPage = ({ stocks }) => {
  const [selectedStock, setSelectedStock] = useState('');
  const [timeInterval, setTimeInterval] = useState(60);
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredData, setHoveredData] = useState(null);

  const fetchStockData = useCallback(async (ticker, minutes) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/stocks/${ticker}?minutes=${minutes}`, {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStockData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStock) {
      fetchStockData(selectedStock, timeInterval);
    }
  }, [selectedStock, timeInterval, fetchStockData]);

  const chartData = useMemo(() => {
    if (!stockData || !Array.isArray(stockData)) return [];
    
    return stockData.map((item, index) => ({
      index,
      price: item.price,
      time: new Date(item.lastUpdatedAt).toLocaleTimeString(),
      fullTime: item.lastUpdatedAt,
    }));
  }, [stockData]);

  const averagePrice = useMemo(() => {
    if (!chartData.length) return 0;
    return chartData.reduce((sum, item) => sum + item.price, 0) / chartData.length;
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          <Typography variant="body2">Time: {data.time}</Typography>
          <Typography variant="body2" color="primary">
            Price: ${data.price.toFixed(2)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Average: ${averagePrice.toFixed(2)}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Select Stock</InputLabel>
            <Select
              value={selectedStock}
              label="Select Stock"
              onChange={(e) => setSelectedStock(e.target.value)}
            >
              {Object.entries(stocks).map(([name, ticker]) => (
                <MenuItem key={ticker} value={ticker}>
                  {name} ({ticker})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Time Interval (minutes)</InputLabel>
            <Select
              value={timeInterval}
              label="Time Interval (minutes)"
              onChange={(e) => setTimeInterval(e.target.value)}
            >
              <MenuItem value={15}>Last 15 minutes</MenuItem>
              <MenuItem value={30}>Last 30 minutes</MenuItem>
              <MenuItem value={60}>Last 1 hour</MenuItem>
              <MenuItem value={120}>Last 2 hours</MenuItem>
              <MenuItem value={360}>Last 6 hours</MenuItem>
              <MenuItem value={720}>Last 12 hours</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error: {error}
        </Alert>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {chartData.length > 0 && !loading && (
        <Paper elevation={3} sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {Object.keys(stocks).find(name => stocks[name] === selectedStock)} ({selectedStock})
          </Typography>
          <Box sx={{ height: 400, mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#2196f3"
                  strokeWidth={2}
                  dot={{ fill: '#2196f3', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#2196f3', strokeWidth: 2 }}
                />
                <ReferenceLine
                  y={averagePrice}
                  stroke="#ff5722"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: `Avg: $${averagePrice.toFixed(2)}`, position: 'topRight' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

// Correlation Heatmap Component
const CorrelationHeatmap = ({ stocks }) => {
  const [timeInterval, setTimeInterval] = useState(60);
  const [correlationData, setCorrelationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredStock, setHoveredStock] = useState(null);
  const [stockStats, setStockStats] = useState({});

  const stockTickers = Object.values(stocks);
  const stockNames = Object.keys(stocks);

  const fetchAllStockData = useCallback(async (minutes) => {
    setLoading(true);
    setError(null);
    
    try {
      const promises = stockTickers.map(ticker =>
        fetch(`${API_BASE}/stocks/${ticker}?minutes=${minutes}`, {
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
          },
        }).then(res => res.json())
      );
      
      const results = await Promise.all(promises);
      
      // Calculate correlations
      const correlations = [];
      const stats = {};
      
      for (let i = 0; i < stockTickers.length; i++) {
        const ticker1 = stockTickers[i];
        const data1 = results[i];
        
        if (!Array.isArray(data1)) continue;
        
        const prices1 = data1.map(item => item.price);
        stats[ticker1] = {
          mean: calculateMean(prices1),
          std: calculateStandardDeviation(prices1),
        };
        
        for (let j = 0; j < stockTickers.length; j++) {
          const ticker2 = stockTickers[j];
          const data2 = results[j];
          
          if (!Array.isArray(data2)) continue;
          
          const prices2 = data2.map(item => item.price);
          
          // Find common time points (simplified for demo)
          const minLength = Math.min(prices1.length, prices2.length);
          const correlation = i === j ? 1 : calculateCorrelation(
            prices1.slice(0, minLength),
            prices2.slice(0, minLength)
          );
          
          correlations.push({
            x: j,
            y: i,
            value: correlation,
            ticker1,
            ticker2,
          });
        }
      }
      
      setCorrelationData(correlations);
      setStockStats(stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [stockTickers]);

  useEffect(() => {
    fetchAllStockData(timeInterval);
  }, [timeInterval, fetchAllStockData]);

  const getCorrelationColor = (value) => {
    if (value >= 0.7) return '#4caf50';
    if (value >= 0.3) return '#8bc34a';
    if (value >= -0.3) return '#ffc107';
    if (value >= -0.7) return '#ff9800';
    return '#f44336';
  };

  const HeatmapCell = ({ payload }) => {
    if (!payload) return null;
    
    const { x, y, value, ticker1, ticker2 } = payload;
    const size = 30;
    const color = getCorrelationColor(value);
    
    return (
      <g>
        <rect
          x={x * size}
          y={y * size}
          width={size}
          height={size}
          fill={color}
          stroke="#fff"
          strokeWidth={1}
          onMouseEnter={() => setHoveredStock({ ticker1, ticker2, value })}
          onMouseLeave={() => setHoveredStock(null)}
        />
        <text
          x={x * size + size / 2}
          y={y * size + size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          fill="#fff"
        >
          {value.toFixed(2)}
        </text>
      </g>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Time Interval (minutes)</InputLabel>
            <Select
              value={timeInterval}
              label="Time Interval (minutes)"
              onChange={(e) => setTimeInterval(e.target.value)}
            >
              <MenuItem value={15}>Last 15 minutes</MenuItem>
              <MenuItem value={30}>Last 30 minutes</MenuItem>
              <MenuItem value={60}>Last 1 hour</MenuItem>
              <MenuItem value={120}>Last 2 hours</MenuItem>
              <MenuItem value={360}>Last 6 hours</MenuItem>
              <MenuItem value={720}>Last 12 hours</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error: {error}
        </Alert>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {correlationData.length > 0 && !loading && (
        <Paper elevation={3} sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Stock Correlation Heatmap
          </Typography>
          
          {/* Correlation Legend */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Correlation Strength:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {[
                { range: '0.7 to 1.0', color: '#4caf50', label: 'Strong Positive' },
                { range: '0.3 to 0.7', color: '#8bc34a', label: 'Moderate Positive' },
                { range: '-0.3 to 0.3', color: '#ffc107', label: 'Weak' },
                { range: '-0.7 to -0.3', color: '#ff9800', label: 'Moderate Negative' },
                { range: '-1.0 to -0.7', color: '#f44336', label: 'Strong Negative' },
              ].map((item) => (
                <Box key={item.range} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      bgcolor: item.color,
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="body2">
                    {item.label} ({item.range})
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Heatmap */}
          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ width: `${stockTickers.length * 30}px`, height: `${stockTickers.length * 30}px` }}>
              <svg width="100%" height="100%">
                {correlationData.map((item, index) => (
                  <HeatmapCell key={index} payload={item} />
                ))}
              </svg>
            </Box>
          </Box>

          {/* Stock Labels */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Stock Labels:
            </Typography>
            <Grid container spacing={1}>
              {stockTickers.map((ticker, index) => (
                <Grid item xs={12} sm={6} md={4} key={ticker}>
                  <Typography variant="body2">
                    {index}: {ticker}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Hovered Stock Stats */}
          {hoveredStock && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6">
                  Correlation Details
                </Typography>
                <Typography variant="body2">
                  {hoveredStock.ticker1} ↔ {hoveredStock.ticker2}
                </Typography>
                <Typography variant="body2">
                  Correlation: {hoveredStock.value.toFixed(4)}
                </Typography>
                {stockStats[hoveredStock.ticker1] && (
                  <Typography variant="body2">
                    {hoveredStock.ticker1} - Average: ${stockStats[hoveredStock.ticker1].mean.toFixed(2)}, 
                    Std Dev: ${stockStats[hoveredStock.ticker1].std.toFixed(2)}
                  </Typography>
                )}
                {stockStats[hoveredStock.ticker2] && (
                  <Typography variant="body2">
                    {hoveredStock.ticker2} - Average: ${stockStats[hoveredStock.ticker2].mean.toFixed(2)}, 
                    Std Dev: ${stockStats[hoveredStock.ticker2].std.toFixed(2)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Paper>
      )}
    </Container>
  );
};

// Main App Component
const App = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stocks, setStocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStocks = async () => {
    try {
      const response = await fetch(`${API_BASE}/stocks`, {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStocks(data.stocks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">
          Error loading stocks: {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Stock Price Aggregation
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Paper square>
        <Tabs
          value={activeTab}
          onChange={(event, newValue) => setActiveTab(newValue)}
          aria-label="stock app tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Stock Charts" />
          <Tab label="Correlation Heatmap" />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 2 }}>
        {activeTab === 0 && <StockPage stocks={stocks} />}
        {activeTab === 1 && <CorrelationHeatmap stocks={stocks} />}
      </Box>
    </Box>
  );
};

export default App;