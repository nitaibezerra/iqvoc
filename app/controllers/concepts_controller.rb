class ConceptsController < ApplicationController
  skip_before_filter :require_user
  
  def index
    authorize! :read, Concept::Base
    respond_to do |format|
      format.json do
        @concepts = (Iqvoc::Concept.base_class.editor_selectable.with_pref_labels & Label::Base.where(Label::Base.arel_table[:value].matches("#{params[:query]}%"))).all
        response = []
        @concepts.each { |concept| response << {:id => concept.id, :name => concept.pref_label.value, :origin => concept.origin, :published => concept.published?}}

        render :json => response
      end
    end
  end

  def show
    @concept = Iqvoc::Concept.base_class.by_origin(params[:id]).published.with_associations.last
    raise ActiveRecord::RecordNotFound unless @concept
    authorize! :read, @concept
    @new_concept_version = Iqvoc::Concept.base_class.by_origin(params[:id]).unpublished.last
    respond_to do |format|
      format.html do
        store_location
      end
      format.rdf
      format.ttl
    end
  end
  
end
