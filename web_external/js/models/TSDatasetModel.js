minerva.models.TSDatasetModel = minerva.models.DatasetModel.extend({
    initialize: function (options) {
        this.set('location', options.location);
        this.set('covars', options.covars);

        this.fetchTimeSeriesData();

        this.set('tsDisplayData', _.map(this.get('tsData'), _.clone));
    },

    _grouper: function(groupBy) {
        // Defaults to group by month
        var grouper = {
            keyFunc: function(d) {
                return new Date(d.date.getUTCFullYear(), d.date.getUTCMonth());
            },
            dateToKeyFunc: function(d) {
                return new Date(d);
            }
        };

        if (groupBy === 'yearly') {
            grouper.keyFunc = function(d) {
                return d.date.getUTCFullYear();
            };

            grouper.dateToKeyFunc = function(d) {
                return new Date(d, 0);
            };
        } else if (groupBy === 'weekly') {
            grouper.keyFunc = function(d) {
                return [d.date.getUTCFullYear(), d3.time.format("%U")(d.date)];
            };

            grouper.dateToKeyFunc = function(d) {
                // d3 can not parse the week number without the day of week,
                // so we always pass 0 as the day of week.
                // see https://github.com/mbostock/d3/issues/1914
                d += ",0";
                return d3.time.format("%Y,%U,%w").parse(d);
            };
        } else if (groupBy === 'daily') {
            grouper.keyFunc = function(d) {
                return new Date(d.date.getUTCFullYear(), d.date.getUTCMonth(), d.date.getUTCDate());
            };

            grouper.dateToKeyFunc = function(d) {
                return new Date(d);
            };
        }

        return grouper;
    },

    groupedBy: function(type, datasets) {
        var grouper = this._grouper(type);
        datasets = datasets || _.map(this.get('tsData'), _.clone);

        datasets = _.map(datasets, function(dataset) {
            dataset.data = _.map(d3.nest()
                                 .key(grouper.keyFunc)
                                 .rollup(function(d) {
                                     return d3.sum(d, function(g) {
                                         return g.value;
                                     });
                                 }).entries(dataset.data),
                                 function(datum) {
                                     return {
                                         date: grouper.dateToKeyFunc(datum.key),
                                         value: datum.values
                                     };
                                 });
            return dataset;
        });

        this.set('tsDisplayData', datasets);
    },

    fetchTimeSeriesData: function() {
        var _this = this;

        $.ajax({
            url: 'https://tempus-demo.ngrok.com/api/series',
            data: {
                table: 'escort_ads',
                sort: 1,
                response_col: 'price_per_hour',
                group_col: 'msaname',
                group: _this.get('location')
            },
            async: false,
            dataType: 'json',
            success: function(data) {
                _this.set('tsData', [{
                    label: 'raw',
                    data: data.result
                }]);

                $.ajax({
                    url: 'https://tempus-demo.ngrok.com/api/comparison',
                    data: {
                        table: 'escort_ads',
                        sort: 1,
                        response_col: 'price_per_hour',
                        group_col: 'msaname',
                        group: _this.get('location'),
                        covs: _this.get('covars')
                    },
                    async: false,
                    dataType: 'json',
                    success: function(compData) {
                        var similarModels = [],
                            tsData = _this.get('tsData');

                        compData.groups = _.map(compData.groups, function(s) {
                            return s.replace(/ MSA$/, '');
                        });

                        similarModels = _.map(compData.groups, function(group) {
                            //return terra.msaCollection.get(group);
                        });

                        tsData.push({
                            label: 'comp',
                            groups: compData.groups,
                            data: compData.result
                        });

                        _this.set('tsData', tsData);
                        _this.set('similarModels', similarModels);
                    }
                });
            }
        });

        // Postprocess data
        var dateParser = d3.time.format("%Y-%m-%d %H:%M:%S").parse;
        _.each(this.get('tsData'), function(dataset) {
            dataset.data = _.map(dataset.data, function(datum) {
                datum[0] = dateParser(datum[0]);

                return {
                    date: datum[0],
                    value: datum[1]
                };
            });
        });
    }
});