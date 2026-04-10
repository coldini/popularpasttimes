const FindLocation = () => {
    const [location, setLocation] = React.useState('');
    const [country, setCountry] = React.useState('');
    const [state, setState] = React.useState('');
    const [cost, setCost] = React.useState('any');
    const [groupSize, setGroupSize] = React.useState('');
    const [activityType, setActivityType] = React.useState('');
    const [results, setResults] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [geoLoading, setGeoLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        // Initialize map when component mounts
        if (typeof initMap === 'function') {
            initMap();
        }
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams({
                city: location,
                country,
                state,
                cost,
                groupSize,
                activityType
            });

            // Detect if running locally or deployed
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiUrl = isLocal ? `http://localhost:3000/findLocation?${params}` : `/findLocation?${params}`;

            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.error) {
                setError(data.error);
                setResults([]);
            } else {
                setResults(data);
                // Render markers on map
                if (typeof renderMarkers === 'function') {
                    renderMarkers(data);
                }
            }
        } catch (err) {
            if (err.message && err.message.includes("Unexpected token '<'")) {
                setError('Search feature is not available in the deployed version. Please run locally with npm start for full functionality.');
            } else {
                setError('Failed to search activities');
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFindNearMe = async () => {
        setGeoLoading(true);
        setError('');

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            setGeoLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    
                    const params = new URLSearchParams({
                        lat: latitude,
                        lon: longitude,
                        cost,
                        groupSize,
                        activityType
                    });

                    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                    const apiUrl = isLocal ? `http://localhost:3000/findLocation?${params}` : `/findLocation?${params}`;

                    const response = await fetch(apiUrl);
                    const data = await response.json();

                    if (data.error) {
                        setError(data.error);
                        setResults([]);
                    } else {
                        setResults(data);
                        // Render markers on map with center at user location
                        if (typeof renderMarkers === 'function') {
                            renderMarkers(data, [latitude, longitude]);
                        }
                    }
                } catch (err) {
                    setError('Failed to search nearby activities: ' + err.message);
                    console.error(err);
                } finally {
                    setGeoLoading(false);
                }
            },
            (error) => {
                setError('Location access denied or unavailable: ' + error.message);
                setGeoLoading(false);
            }
        );
    };

    return React.createElement('div', {style: {padding: '20px'}},
        React.createElement('h2', null, 'Find Activities by Location'),
        React.createElement('form', {onSubmit: handleSearch, style: {marginBottom: '20px'}},
            React.createElement('div', {style: {marginBottom: '10px'}},
                React.createElement('label', null, 'Location (City): '),
                React.createElement('input', {
                    type: 'text',
                    value: location,
                    onChange: (e) => setLocation(e.target.value),
                    placeholder: 'Enter city name',
                    required: true
                })
            ),
            React.createElement('div', {style: {marginBottom: '10px'}},
                React.createElement('label', null, 'Country: '),
                React.createElement('input', {
                    type: 'text',
                    value: country,
                    onChange: (e) => setCountry(e.target.value),
                    placeholder: 'e.g., USA, Japan'
                })
            ),
            React.createElement('div', {style: {marginBottom: '10px'}},
                React.createElement('label', null, 'State/Province (optional): '),
                React.createElement('input', {
                    type: 'text',
                    value: state,
                    onChange: (e) => setState(e.target.value),
                    placeholder: 'e.g., California, Tokyo'
                })
            ),
            React.createElement('div', {style: {marginBottom: '10px'}},
                React.createElement('label', null, 'Cost: '),
                React.createElement('select', {
                    value: cost,
                    onChange: (e) => setCost(e.target.value)
                },
                    React.createElement('option', {value: 'any'}, 'Any'),
                    React.createElement('option', {value: 'free'}, 'Free'),
                    React.createElement('option', {value: '$0-$10'}, '$0-$10'),
                    React.createElement('option', {value: '$10-$25'}, '$10-$25'),
                    React.createElement('option', {value: '$25-$50'}, '$25-$50'),
                    React.createElement('option', {value: '$50+'}, '$50+')
                )
            ),
            React.createElement('div', {style: {marginBottom: '10px'}},
                React.createElement('label', null, 'Group Size: '),
                React.createElement('select', {
                    value: groupSize,
                    onChange: (e) => setGroupSize(e.target.value)
                },
                    React.createElement('option', {value: ''}, 'Any'),
                    React.createElement('option', {value: '1-2'}, '1-2'),
                    React.createElement('option', {value: '3-5'}, '3-5'),
                    React.createElement('option', {value: '6-10'}, '6-10'),
                    React.createElement('option', {value: '10+'}, '10+')
                )
            ),
            React.createElement('div', {style: {marginBottom: '10px'}},
                React.createElement('label', null, 'Activity Type: '),
                React.createElement('select', {
                    value: activityType,
                    onChange: (e) => setActivityType(e.target.value)
                },
                    React.createElement('option', {value: ''}, 'Any activity type'),
                    React.createElement('option', {value: 'outdoor'}, 'Outdoor'),
                    React.createElement('option', {value: 'indoor'}, 'Indoor'),
                    React.createElement('option', {value: 'adventure'}, 'Adventure'),
                    React.createElement('option', {value: 'cultural'}, 'Cultural'),
                    React.createElement('option', {value: 'food'}, 'Food & Drink'),
                    React.createElement('option', {value: 'entertainment'}, 'Entertainment'),
                    React.createElement('option', {value: 'educational'}, 'Educational')
                )
            ),
            React.createElement('div', {style: {marginBottom: '10px', display: 'flex', gap: '10px'}},
                React.createElement('button', {type: 'submit', disabled: loading},
                    loading ? 'Searching...' : 'Search'
                ),
                React.createElement('button', {
                    type: 'button',
                    onClick: handleFindNearMe,
                    disabled: geoLoading,
                    style: {backgroundColor: '#4CAF50', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: geoLoading ? 'not-allowed' : 'pointer'}
                },
                    geoLoading ? 'Getting location...' : '📍 Find Near Me'
                )
            )
        ),
        error && React.createElement('p', {style: {color: 'red'}}, error),
        React.createElement('div', {id: 'map', style: {height: '400px', width: '100%', marginTop: '20px'}}),
        results.length > 0 && React.createElement('div', null,
            React.createElement('h3', null, `Found ${results.length} activities`),
            React.createElement('ul', null,
                results.map((activity, index) =>
                    React.createElement('li', {key: index},
                        React.createElement('strong', null, activity.name),
                        ` - ${activity.type || 'Activity'} (${activity.cost || 'Price not specified'})`
                    )
                )
            )
        )
    );
};