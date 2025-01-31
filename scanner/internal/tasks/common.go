package tasks

import (
	"fmt"
	"path"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/rs/zerolog/log"
)

// Push parsed metadata and saves related illustration/thumbnail
func pushMetadata(fileFullPath string, m internal.Metadata, c config.Config, w *Worker, updateMethod api.SaveMetadataMethod) error {
	created, err := api.SaveMetadata(c, m, updateMethod)
	if err != nil {
		return fmt.Errorf("saving metadata failed, this might be a bug")
	}
	if len(m.IllustrationLocation) > 0 {
		err := SaveIllustration(IllustrationTask{
			IllustrationLocation:    m.IllustrationLocation,
			IllustrationPath:        m.IllustrationPath,
			TrackPath:               fileFullPath,
			TrackId:                 created.TrackId,
			IllustrationStreamIndex: m.IllustrationStreamIndex,
		}, c)
		if err != nil {
			// Illustration POST failure is not fatal
			// So we do not return an error to the caller
			log.Error().
				Str("path", path.Base(fileFullPath)).
				Msgf("Saving illustration failed")
			log.Trace().Msg(err.Error())
		}
	}
	if m.Type == internal.Video {
		go func() {
			w.thumbnailQueue <- ThumbnailTask{
				TrackId:       created.TrackId,
				TrackDuration: int(m.Duration),
				FilePath:      fileFullPath,
			}
		}()
	}
	return nil
}
