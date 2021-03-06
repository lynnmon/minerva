/**
* This widget displays a form for adding an Elasticsearch source.
*/
minerva.views.AddElasticsearchSourceWidget = minerva.View.extend({

    events: {
        'submit #m-add-elasticsearch-source-form': function (e) {
            e.preventDefault();
            var params = {
                name: this.$('#m-elasticsearch-name').val(),
                baseURL: this.$('#m-elasticsearch-uri').val(),
                index: this.$('#m-elasticsearch-index').val(),
                username: this.$('#m-elasticsearch-username').val(),
                password: this.$('#m-elasticsearch-password').val()
            };
            var elasticsearchSource = new minerva.models.ElasticsearchSourceModel({});
            elasticsearchSource.on('m:sourceReceived', function () {
                this.$el.modal('hide');
                this.collection.add(elasticsearchSource);
            }, this).createSource(params);
        }
    },

    initialize: function (settings) {
        this.collection = settings.collection;
        this.title = 'Enter Elasticsearch Source details';
    },

    render: function () {
        var modal = this.$el.html(minerva.templates.addElasticsearchSourceWidget({}));
        modal.trigger($.Event('ready.girder.modal', {relatedTarget: modal}));
        return this;
    }

});
