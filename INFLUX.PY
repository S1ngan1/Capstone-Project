from influxdb import InfluxDBClient
# InfluxDB connection settings
INFLUXDB_HOST = 'localhost'
INFLUXDB_PORT = 8086
INFLUXDB_USER = 'root'
INFLUXDB_PASSWORD = 'root'
INFLUXDB_DBNAME = 'example_db'

def get_influxdb_client():
    client = InfluxDBClient(
        host=INFLUXDB_HOST,
        port=INFLUXDB_PORT,
        username=INFLUXDB_USER,
        password=INFLUXDB_PASSWORD,
        database=INFLUXDB_DBNAME
    )
    return client

def write_example_point():
    client = get_influxdb_client()
    json_body = [
        {
            "measurement": "example_measurement",
            "tags": {
                "tag_key": "tag_value"
            },
            "fields": {
                "value": 0.64
            }
        }
    ]
    client.write_points(json_body)

def query_example():
    client = get_influxdb_client()
    result = client.query('SELECT * FROM example_measurement')
    for point in result.get_points():
        print(point)

if __name__ == "__main__":
    write_example_point()
    query_example()
    