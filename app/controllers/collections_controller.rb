class CollectionsController < ApplicationController

  def index
    @collections = Collection::SKOS::Base.all
  end
  
  def show
    @collection = Collection::SKOS::Base.find(params[:id])
  end
  
  def new
    @collection = Collection::SKOS::Unordered.new
    @collection.note_iqvoc_language_notes.build if @collection.note_iqvoc_language_notes.empty?
    @collection.note_skos_definitions.build if @collection.note_skos_definitions.empty?
  end
  
  def create
    @collection = Collection::SKOS::Unordered.new(params[:collection])
    
    if @collection.save
      flash[:notice] = I18n.t("txt.controllers.collections.save.success")
      redirect_to collections_path(:lang => I18n.locale)
    else
      flash[:error] = I18n.t("txt.controllers.collections.save.error")
      render :new
    end
  end
  
  def destroy
    @collection = Collection::SKOS::Base.find(params[:id])
    if @collection.destroy
      flash[:notice] = I18n.t("txt.controllers.collections.destroy.success")
      redirect_to collections_path(:lang => I18n.locale)
    else
      flash[:error] = I18n.t("txt.controllers.collections.destroy.error")
      render :action => :show
    end
  end
  
end
